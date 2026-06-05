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
    # List/compare views only render the first photo thumbnail, so slice to 1
    # photo to keep payloads small (full photos load on the detail endpoint).
    projection = {"_id": 0, "photos": {"$slice": 1}}
    docs = (
        await db.properties.find(query, projection)
        .sort("created_at", -1)
        .to_list(200)
    )
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


def _extract_listing(page: str, url: str) -> Optional[Dict[str, Any]]:
    """Parse listing details from page HTML. Returns None if nothing usable."""
    # 1) Structured Next.js data (Property Finder & similar)
    m = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
        page,
        re.S,
    )
    if m:
        try:
            data = json.loads(m.group(1))
            pf = _parse_property_finder(data)
            if pf and (pf.get("title") or pf.get("price") or pf.get("address")):
                return pf
        except json.JSONDecodeError:
            pass

    # 2) OpenGraph meta tags (works for most listing sites)
    og_image = _og_meta(page, "image")
    og_title = _og_meta(page, "title")
    desc = _og_meta(page, "description")
    result: Dict[str, Any] = {
        "type": "buy",
        "title": og_title,
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
    blob = f"{og_title} {desc}"
    # Rent vs Buy hint
    if re.search(r"\b(for rent|to rent|rental|/year|/month|yearly|monthly)\b", blob, re.I):
        result["type"] = "rent"
        result["price_period"] = "month"
    # Best-effort price (e.g. "AED 2,200,000")
    pm = re.search(r"(?:AED|د\.إ|USD|\$)\s*([\d,]{4,})", blob, re.I)
    if pm:
        try:
            result["price"] = float(pm.group(1).replace(",", ""))
        except ValueError:
            pass
    # Best-effort beds (e.g. "2 Bedroom" / "Studio")
    bm = re.search(r"(\d+)\s*(?:bed|bedroom|br)\b", blob, re.I)
    if bm:
        result["rooms"] = f"{bm.group(1)} bed"
    elif re.search(r"\bstudio\b", blob, re.I):
        result["rooms"] = "Studio"
    sm = re.search(r"([\d,]{2,})\s*(?:sqft|sq\.?\s?ft|sqm|m²|m2)", blob, re.I)
    if sm:
        result["size"] = sm.group(0)

    if og_title or result["price"] or og_image:
        return result
    return None


def _is_meaningful(d: Optional[Dict[str, Any]]) -> bool:
    return bool(d and (d.get("title") or d.get("price") or d.get("address")))


def _fetch_via_scraperapi(url: str, premium: bool = False) -> Optional[str]:
    """Fetch a URL through ScraperAPI (JS render + proxy). Returns HTML or None.

    `premium=True` requests residential/premium proxies for hard anti-bot sites
    (Bayut, Dubizzle). Requires a paid ScraperAPI plan; on plans without it the
    call returns non-200 and we simply fall through.
    """
    api_key = os.environ.get("SCRAPER_API_KEY", "").strip()
    if not api_key:
        return None
    # ScraperAPI requires its own params before the target url.
    params = {
        "api_key": api_key,
        "render": "true",
        "country_code": "ae",
    }
    if premium:
        params["ultra_premium"] = "true"
    params["url"] = url
    try:
        resp = requests.get("https://api.scraperapi.com/", params=params, timeout=70)
        if resp.status_code == 200:
            return resp.text
        logger.warning(
            f"scraperapi non-200 (premium={premium}): {resp.status_code} {resp.text[:160]}"
        )
    except Exception as e:
        logger.warning(f"scraperapi fetch failed (premium={premium}): {e}")
    return None


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

    # 1) Fast direct fetch
    result = None
    direct_ok = False
    try:
        resp = requests.get(url, headers=headers, timeout=20)
        if resp.status_code == 200 and resp.url and "/login" not in resp.url:
            direct_ok = True
            result = _extract_listing(resp.text, url)
    except Exception as e:
        logger.warning(f"parse-link direct fetch failed: {e}")

    # 2) Fallback to ScraperAPI when direct is blocked or yields nothing useful
    if not _is_meaningful(result):
        scraped = _fetch_via_scraperapi(url)
        if scraped:
            scraped_result = _extract_listing(scraped, url)
            if _is_meaningful(scraped_result):
                result = scraped_result

    # 2b) Still nothing? Retry with premium/residential proxies for hard
    #     anti-bot sites (Bayut, Dubizzle). No-op on plans without premium.
    if not _is_meaningful(result):
        scraped = _fetch_via_scraperapi(url, premium=True)
        if scraped:
            scraped_result = _extract_listing(scraped, url)
            if _is_meaningful(scraped_result):
                result = scraped_result

    # 3) If we still have nothing and never reached the page at all, error out
    if result is None:
        if not direct_ok:
            raise HTTPException(
                status_code=422,
                detail="Could not read that link. The site may block automated reading, or the URL is invalid.",
            )
        # Reached page but found nothing parseable — return empty shell
        result = {
            "type": "buy",
            "title": "",
            "address": "",
            "price": None,
            "price_period": "total",
            "rooms": "",
            "size": "",
            "broker_name": "",
            "broker_phone": "",
            "broker_email": "",
            "photos": [],
            "source": "generic",
        }

    result["listing_url"] = url
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
