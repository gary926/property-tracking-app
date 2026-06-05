from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
import uuid
import re
import json
import html as html_lib
import requests
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


class ParseLinkRequest(BaseModel):
    url: str


def _strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text or "")
    return html_lib.unescape(text).strip()


def _og_meta(html: str, prop: str) -> str:
    m = re.search(
        rf'<meta[^>]+property=["\']og:{prop}["\'][^>]+content=["\']([^"\']*)["\']',
        html,
        re.I,
    )
    if not m:
        m = re.search(
            rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]+property=["\']og:{prop}["\']',
            html,
            re.I,
        )
    return html_lib.unescape(m.group(1)) if m else ""


def _parse_property_finder(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    try:
        prop = data["props"]["pageProps"]["propertyResult"]["property"]
    except (KeyError, TypeError):
        return None

    price_obj = prop.get("price") or {}
    period = (price_obj.get("period") or "").lower()
    offering = (prop.get("offering_type") or "").lower()
    is_rent = period == "rent" or "rent" in offering
    ptype = "rent" if is_rent else "buy"

    # Rooms string
    beds = prop.get("bedrooms")
    baths = prop.get("bathrooms")
    parts = []
    if beds is not None and str(beds) != "":
        if str(beds).lower() in ("0", "studio"):
            parts.append("Studio")
        else:
            parts.append(f"{beds} bed")
    if baths is not None and str(baths) != "":
        parts.append(f"{baths} bath")
    rooms = " · ".join(parts)

    # Size
    size_obj = prop.get("size") or {}
    size = ""
    if size_obj.get("value"):
        size = f"{size_obj['value']} {size_obj.get('unit', '')}".strip()

    # Broker contact
    broker_name = (prop.get("broker") or {}).get("name", "")
    broker_phone = ""
    broker_email = ""
    for opt in prop.get("contact_options") or []:
        if opt.get("type") == "phone" and not broker_phone:
            broker_phone = opt.get("value", "")
        if opt.get("type") == "email" and not broker_email:
            broker_email = opt.get("value", "")
    if not broker_email:
        broker_email = (prop.get("agent") or {}).get("email", "")

    # Images
    photos = []
    for img in (prop.get("images") or {}).get("property", [])[:10]:
        url = img.get("medium") or img.get("full") or img.get("small")
        if url:
            photos.append(url)

    return {
        "type": ptype,
        "title": prop.get("title", ""),
        "address": (prop.get("location") or {}).get("full_name", ""),
        "price": price_obj.get("value"),
        "price_period": "month" if is_rent else "total",
        "rooms": rooms,
        "size": size,
        "broker_name": broker_name,
        "broker_phone": broker_phone,
        "broker_email": broker_email,
        "photos": photos,
        "source": "propertyfinder",
    }


@api_router.post("/properties/parse-link")
async def parse_link(payload: ParseLinkRequest):
    url = payload.url.strip()
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        logger.warning(f"parse-link fetch failed: {e}")
        raise HTTPException(status_code=422, detail="Could not reach that link. Please check the URL.")

    page = resp.text

    # 1) Try structured Next.js data (Property Finder & similar)
    result = None
    m = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
        page,
        re.S,
    )
    if m:
        try:
            data = json.loads(m.group(1))
            result = _parse_property_finder(data)
        except json.JSONDecodeError:
            result = None

    # 2) Fallback to OpenGraph meta tags (works for most listing sites)
    if not result:
        og_image = _og_meta(page, "image")
        result = {
            "type": "buy",
            "title": _og_meta(page, "title"),
            "address": "",
            "price": None,
            "price_period": "total",
            "rooms": "",
            "size": "",
            "broker_name": "",
            "broker_phone": "",
            "broker_email": "",
            "photos": [og_image] if og_image else [],
            "source": "generic",
        }
        # Best-effort price from description/title (e.g. "AED 2,200,000")
        desc = _og_meta(page, "description")
        pm = re.search(r"(?:AED|د\.إ)\s*([\d,]{4,})", f"{result['title']} {desc}", re.I)
        if pm:
            try:
                result["price"] = float(pm.group(1).replace(",", ""))
            except ValueError:
                pass

    result["listing_url"] = url
    # Clean empty strings -> keep keys for frontend convenience
    return result



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
