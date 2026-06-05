"""Backend API tests for Property Tracker."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "https://listing-hub-77.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created_ids():
    return []


# ---- Health ----
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        assert "message" in r.json()


# ---- LIST ----
class TestList:
    def test_list_all(self, client):
        r = client.get(f"{API}/properties")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # seeded 7
        assert len(data) >= 7
        # validate no _id leaking, fields present
        for p in data:
            assert "_id" not in p
            assert "id" in p and "type" in p and "status" in p

    def test_list_filter_buy(self, client):
        r = client.get(f"{API}/properties", params={"type": "buy"})
        assert r.status_code == 200
        data = r.json()
        assert all(p["type"] == "buy" for p in data)
        assert len(data) >= 4

    def test_list_filter_rent(self, client):
        r = client.get(f"{API}/properties", params={"type": "rent"})
        assert r.status_code == 200
        data = r.json()
        assert all(p["type"] == "rent" for p in data)
        assert len(data) >= 3

    def test_list_filter_status(self, client):
        r = client.get(f"{API}/properties", params={"status": "to_view"})
        assert r.status_code == 200
        data = r.json()
        assert all(p["status"] == "to_view" for p in data)


# ---- CREATE / GET ----
class TestCreateGetUpdateDelete:
    def test_create_and_get(self, client, created_ids):
        payload = {
            "type": "buy",
            "title": "TEST_Sunny Loft",
            "address": "123 Test St",
            "price": 450000,
            "price_period": "total",
            "rooms": "3 bed",
            "size": "95 m2",
            "broker_name": "TEST Broker",
            "broker_phone": "+11111111",
            "broker_email": "test@x.com",
            "listing_url": "https://example.com/test",
            "photos": [],
            "rating": 4,
            "notes": "test notes",
            "status": "to_view",
        }
        r = client.post(f"{API}/properties", json=payload)
        assert r.status_code == 200, r.text
        prop = r.json()
        assert prop["title"] == "TEST_Sunny Loft"
        assert prop["price"] == 450000
        assert prop["status"] == "to_view"
        assert "id" in prop
        assert "_id" not in prop
        created_ids.append(prop["id"])

        # GET verifies persistence
        r2 = client.get(f"{API}/properties/{prop['id']}")
        assert r2.status_code == 200
        got = r2.json()
        assert got["id"] == prop["id"]
        assert got["title"] == "TEST_Sunny Loft"
        assert got["broker_email"] == "test@x.com"

    def test_get_nonexistent(self, client):
        r = client.get(f"{API}/properties/does-not-exist-xyz")
        assert r.status_code == 404

    def test_update_status_and_rating(self, client, created_ids):
        assert created_ids, "create test must run first"
        pid = created_ids[0]
        r = client.put(f"{API}/properties/{pid}", json={"status": "shortlisted", "rating": 5})
        assert r.status_code == 200, r.text
        updated = r.json()
        assert updated["status"] == "shortlisted"
        assert updated["rating"] == 5

        # verify GET shows persisted change
        g = client.get(f"{API}/properties/{pid}").json()
        assert g["status"] == "shortlisted"
        assert g["rating"] == 5
        # updated_at must have changed
        assert g["updated_at"] >= g["created_at"]

    def test_update_partial_fields(self, client, created_ids):
        pid = created_ids[0]
        r = client.put(f"{API}/properties/{pid}", json={"notes": "TEST_updated notes"})
        assert r.status_code == 200
        assert r.json()["notes"] == "TEST_updated notes"
        # other fields preserved
        g = client.get(f"{API}/properties/{pid}").json()
        assert g["title"] == "TEST_Sunny Loft"
        assert g["status"] == "shortlisted"  # preserved from earlier update

    def test_update_nonexistent(self, client):
        r = client.put(f"{API}/properties/does-not-exist-xyz", json={"status": "viewed"})
        assert r.status_code == 404

    def test_delete_and_verify_404(self, client, created_ids):
        # Create another to delete
        r = client.post(f"{API}/properties", json={"type": "rent", "title": "TEST_ToDelete"})
        assert r.status_code == 200
        pid = r.json()["id"]
        d = client.delete(f"{API}/properties/{pid}")
        assert d.status_code == 200
        assert d.json().get("success") is True
        g = client.get(f"{API}/properties/{pid}")
        assert g.status_code == 404

    def test_delete_nonexistent(self, client):
        r = client.delete(f"{API}/properties/does-not-exist-xyz")
        assert r.status_code == 404


# ---- Cleanup ----
def test_cleanup(client, created_ids):
    for pid in created_ids:
        client.delete(f"{API}/properties/{pid}")
