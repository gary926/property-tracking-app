from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ---------------- Models ----------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class PropertyBase(BaseModel):
    type: str = "buy"  # "buy" | "rent"
    title: str = ""
    address: str = ""
    price: Optional[float] = None
    price_period: str = "total"  # "total" | "month" (for rentals)
    rooms: Optional[str] = None
    size: Optional[str] = None
    broker_name: str = ""
    broker_phone: str = ""
    broker_email: str = ""
    listing_url: str = ""
    photos: List[str] = Field(default_factory=list)  # base64 data URIs
    rating: int = 0  # 0-5
    notes: str = ""
    viewing_date: Optional[str] = None  # ISO string
    status: str = "to_view"  # to_view | viewed | liked | shortlisted | rejected


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    address: Optional[str] = None
    price: Optional[float] = None
    price_period: Optional[str] = None
    rooms: Optional[str] = None
    size: Optional[str] = None
    broker_name: Optional[str] = None
    broker_phone: Optional[str] = None
    broker_email: Optional[str] = None
    listing_url: Optional[str] = None
    photos: Optional[List[str]] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    viewing_date: Optional[str] = None
    status: Optional[str] = None


class Property(PropertyBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "Property Tracker API"}


@api_router.get("/properties", response_model=List[Property])
async def list_properties(type: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    docs = await db.properties.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Property(**d) for d in docs]


@api_router.get("/properties/{property_id}", response_model=Property)
async def get_property(property_id: str):
    doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Property not found")
    return Property(**doc)


@api_router.post("/properties", response_model=Property)
async def create_property(payload: PropertyCreate):
    prop = Property(**payload.dict())
    await db.properties.insert_one(prop.dict())
    return prop


@api_router.put("/properties/{property_id}", response_model=Property)
async def update_property(property_id: str, payload: PropertyUpdate):
    existing = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.properties.update_one({"id": property_id}, {"$set": updates})
    merged = {**existing, **updates}
    return Property(**merged)


@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str):
    res = await db.properties.delete_one({"id": property_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"success": True}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
