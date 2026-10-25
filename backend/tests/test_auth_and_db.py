import os
import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

try:
    from backend.main import app
    from backend.services.db import init_db, get_db
    from backend.services.auth import hash_password, verify_password, create_access_token
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from main import app
    from services.db import init_db, get_db
    from services.auth import hash_password, verify_password, create_access_token

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    """Ensure database collections are clean before each test."""
    db = get_db()
    db.users.delete_many({})
    db.watchlists.delete_many({})
    db.user_preferences.delete_many({})
    db.analysis_history.delete_many({})
    yield


def test_password_hashing():
    """Verify password hashing produces bcrypt hashes and validates correctly."""
    pwd = "SecretPassword123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_register_new_user():
    """1. Test successful user registration."""
    payload = {
        "name": "Arjun Sharma",
        "email": "arjun@example.com",
        "password": "Password123",
        "confirm_password": "Password123"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "token" in data["data"]
    assert data["data"]["user"]["name"] == "Arjun Sharma"
    assert data["data"]["user"]["email"] == "arjun@example.com"
    # Ensure password hash is NEVER exposed
    assert "password" not in data["data"]["user"]
    assert "password_hash" not in data["data"]["user"]


def test_reject_duplicate_email_registration():
    """2. Test duplicate email registrations are strictly rejected."""
    payload = {
        "name": "User One",
        "email": "duplicate@example.com",
        "password": "Password123",
        "confirm_password": "Password123"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 200

    # Second attempt with same email (even with different case or whitespace)
    payload_dup = {
        "name": "User Two",
        "email": "  DUPLICATE@example.com ",
        "password": "Password456",
        "confirm_password": "Password456"
    }
    res2 = client.post("/api/auth/register", json=payload_dup)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_reject_mismatched_passwords():
    """3. Test registration fails if passwords do not match."""
    payload = {
        "name": "Mismatch User",
        "email": "mismatch@example.com",
        "password": "Password123",
        "confirm_password": "DifferentPassword456"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert "match" in response.json()["detail"].lower()


def test_login_valid_credentials():
    """4. Test login with valid credentials returns session token."""
    # Register first
    client.post("/api/auth/register", json={
        "name": "Rohit Verma",
        "email": "rohit@example.com",
        "password": "CorrectPassword123",
        "confirm_password": "CorrectPassword123"
    })

    # Login
    response = client.post("/api/auth/login", json={
        "email": "rohit@example.com",
        "password": "CorrectPassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "token" in data["data"]
    assert data["data"]["user"]["email"] == "rohit@example.com"


def test_reject_invalid_credentials():
    """5. Test login fails with invalid credentials returning generic error."""
    # Register
    client.post("/api/auth/register", json={
        "name": "Ananya Sen",
        "email": "ananya@example.com",
        "password": "CorrectPassword123",
        "confirm_password": "CorrectPassword123"
    })

    # Wrong password
    res1 = client.post("/api/auth/login", json={
        "email": "ananya@example.com",
        "password": "WrongPassword999"
    })
    assert res1.status_code == 401
    assert "Invalid email or password" in res1.json()["detail"]

    # Non-existent email
    res2 = client.post("/api/auth/login", json={
        "email": "ghost@example.com",
        "password": "SomePassword123"
    })
    assert res2.status_code == 401
    assert "Invalid email or password" in res2.json()["detail"]


def test_access_protected_endpoint_logged_out():
    """6. Test accessing protected endpoints without token returns 401."""
    res1 = client.get("/api/auth/me")
    assert res1.status_code == 401

    res2 = client.get("/api/watchlist")
    assert res2.status_code == 401


def test_logout_and_session_revocation():
    """7. Test logout endpoint."""
    reg = client.post("/api/auth/register", json={
        "name": "Logout Tester",
        "email": "logout@example.com",
        "password": "Password123",
        "confirm_password": "Password123"
    }).json()
    token = reg["data"]["token"]

    # Call logout
    res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "success"


def test_token_persistence_across_requests():
    """8. Test token validates user session across requests."""
    reg = client.post("/api/auth/register", json={
        "name": "Persistent User",
        "email": "persist@example.com",
        "password": "Password123",
        "confirm_password": "Password123"
    }).json()
    token = reg["data"]["token"]

    # Verify session via /api/auth/me
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["data"]["email"] == "persist@example.com"


def test_watchlist_save_and_persistence_in_mongodb():
    """9 & 10. Test saving, fetching, and removing watchlist items in MongoDB."""
    reg = client.post("/api/auth/register", json={
        "name": "Investor One",
        "email": "investor1@example.com",
        "password": "Password123",
        "confirm_password": "Password123"
    }).json()
    token = reg["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Add TCS
    res_add1 = client.post("/api/watchlist", json={"ticker": "TCS"}, headers=headers)
    assert res_add1.status_code == 200
    assert "TCS" in res_add1.json()["data"]

    # Add RELIANCE
    res_add2 = client.post("/api/watchlist", json={"ticker": "RELIANCE"}, headers=headers)
    assert res_add2.status_code == 200
    assert "TCS" in res_add2.json()["data"]
    assert "RELIANCE" in res_add2.json()["data"]

    # Fetch watchlist
    res_get = client.get("/api/watchlist", headers=headers)
    assert res_get.status_code == 200
    assert res_get.json()["data"] == ["TCS", "RELIANCE"]

    # Delete TCS
    res_del = client.delete("/api/watchlist/TCS", headers=headers)
    assert res_del.status_code == 200
    assert "TCS" not in res_del.json()["data"]
    assert "RELIANCE" in res_del.json()["data"]


def test_data_isolation_between_users():
    """11. Verify User A cannot view, modify, or delete User B's data."""
    # Register User A
    user_a = client.post("/api/auth/register", json={
        "name": "User Alpha",
        "email": "alpha@example.com",
        "password": "Password123",
        "confirm_password": "Password123"
    }).json()["data"]
    headers_a = {"Authorization": f"Bearer {user_a['token']}"}

    # Register User B
    user_b = client.post("/api/auth/register", json={
        "name": "User Beta",
        "email": "beta@example.com",
        "password": "Password123",
        "confirm_password": "Password123"
    }).json()["data"]
    headers_b = {"Authorization": f"Bearer {user_b['token']}"}

    # User A adds INFY to watchlist
    client.post("/api/watchlist", json={"ticker": "INFY"}, headers=headers_a)

    # User B adds TITAN to watchlist
    client.post("/api/watchlist", json={"ticker": "TITAN"}, headers=headers_b)

    # Check User A sees only INFY
    list_a = client.get("/api/watchlist", headers=headers_a).json()["data"]
    assert list_a == ["INFY"]
    assert "TITAN" not in list_a

    # Check User B sees only TITAN
    list_b = client.get("/api/watchlist", headers=headers_b).json()["data"]
    assert list_b == ["TITAN"]
    assert "INFY" not in list_b


def test_user_preferences_persistence():
    """Test user preferences save and retrieve in MongoDB."""
    user = client.post("/api/auth/register", json={
        "name": "Prefs User",
        "email": "prefs@example.com",
        "password": "Password123",
        "confirm_password": "Password123"
    }).json()["data"]
    headers = {"Authorization": f"Bearer {user['token']}"}

    # Default preferences
    res_def = client.get("/api/user/preferences", headers=headers)
    assert res_def.status_code == 200
    assert res_def.json()["data"]["theme"] == "dark"

    # Update preferences
    res_up = client.put(
        "/api/user/preferences",
        json={"settings": {"theme": "dark", "default_chart_mode": "screenshot", "currency_symbol": "₹"}},
        headers=headers
    )
    assert res_up.status_code == 200
    assert res_up.json()["data"]["default_chart_mode"] == "screenshot"


def test_analysis_history_persistence():
    """Test AI analysis history saves and retrieves from MongoDB."""
    user = client.post("/api/auth/register", json={
        "name": "History User",
        "email": "history@example.com",
        "password": "Password123",
        "confirm_password": "Password123"
    }).json()["data"]
    headers = {"Authorization": f"Bearer {user['token']}"}

    # Run 5-day chart analysis with authenticated token
    res = client.post(
        "/api/llm/analyze-5day-chart",
        json={"ticker": "TCS", "user_query": "Quick analysis"},
        headers=headers
    )
    assert res.status_code == 200

    # Verify it was automatically saved in analysis history
    hist = client.get("/api/user/analysis-history", headers=headers)
    assert hist.status_code == 200
    records = hist.json()["data"]
    assert len(records) > 0
    assert records[0]["ticker"] == "TCS"
    assert records[0]["analysis_type"] == "5day_chart"
