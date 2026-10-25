import os
import re
import datetime
from datetime import timezone, timedelta
from typing import Optional, Dict, Any
import bcrypt
import jwt
from bson import ObjectId
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

try:
    from backend.services.db import get_users_collection
except ImportError:
    from services.db import get_users_collection

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "marketpulse_super_secret_jwt_key_2026_change_in_production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Bearer security scheme for FastAPI OpenAPI docs
security_scheme = HTTPBearer(auto_error=False)

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")


def normalize_email(email: str) -> str:
    """Normalize email address to lowercase and stripped string."""
    return email.strip().lower() if email else ""


def validate_email_format(email: str) -> bool:
    """Validate email address structure."""
    if not email:
        return False
    return bool(EMAIL_REGEX.match(email.strip()))


def hash_password(password: str) -> str:
    """Securely hash a password using bcrypt."""
    if not password:
        raise ValueError("Password cannot be empty.")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored bcrypt hash."""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, name: str) -> str:
    """Generate a signed JWT access token for the authenticated user."""
    expire = datetime.datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "email": email,
        "name": name,
        "exp": expire,
        "iat": datetime.datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a signed JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def serialize_user(user_doc: dict) -> dict:
    """Format MongoDB user document for API response (strips password hash)."""
    if not user_doc:
        return {}
    return {
        "id": str(user_doc.get("_id", "")),
        "name": user_doc.get("name", ""),
        "email": user_doc.get("email", ""),
        "created_at": user_doc.get("created_at", "")
    }


def create_user(name: str, email: str, password: str, confirm_password: str) -> dict:
    """
    Register a new user account in MongoDB.
    Validates required fields, email format, password matching and uniqueness.
    """
    clean_name = (name or "").strip()
    clean_email = normalize_email(email)

    if not clean_name:
        raise HTTPException(status_code=400, detail="Name is required.")
    if not clean_email or not validate_email_format(clean_email):
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    if not password or len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Password and confirm password do not match.")

    users = get_users_collection()

    # Prevent duplicate accounts
    existing = users.find_one({"email": clean_email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    password_hash = hash_password(password)
    now_iso = datetime.datetime.now(timezone.utc).isoformat()

    user_doc = {
        "name": clean_name,
        "email": clean_email,
        "password_hash": password_hash,
        "created_at": now_iso,
        "updated_at": now_iso
    }

    result = users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # Create session token
    user_id_str = str(result.inserted_id)
    token = create_access_token(user_id_str, clean_email, clean_name)

    return {
        "user": serialize_user(user_doc),
        "token": token
    }


def authenticate_user(email: str, password: str) -> dict:
    """
    Authenticate user credentials against MongoDB.
    Returns generic errors for invalid credentials.
    """
    clean_email = normalize_email(email)
    if not clean_email or not password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    users = get_users_collection()
    user_doc = users.find_one({"email": clean_email})

    if not user_doc or not verify_password(password, user_doc.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user_id_str = str(user_doc["_id"])
    token = create_access_token(user_id_str, clean_email, user_doc.get("name", ""))

    return {
        "user": serialize_user(user_doc),
        "token": token
    }


def get_user_by_id(user_id: str) -> Optional[dict]:
    """Retrieve user by MongoDB ID (without password hash)."""
    users = get_users_collection()
    try:
        oid = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        doc = users.find_one({"_id": oid})
        return serialize_user(doc) if doc else None
    except Exception:
        doc = users.find_one({"_id": user_id})
        return serialize_user(doc) if doc else None


async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)
) -> dict:
    """
    FastAPI dependency to enforce authentication on protected endpoints.
    Derives authenticated user identity from the validated JWT token.
    """
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    payload = decode_access_token(auth.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user


async def get_optional_user(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)
) -> Optional[dict]:
    """
    FastAPI dependency to optionally retrieve the authenticated user without failing.
    Useful for endpoints that support both guest and logged-in users.
    """
    if not auth or not auth.credentials:
        return None
    payload = decode_access_token(auth.credentials)
    if not payload or not payload.get("sub"):
        return None
    return get_user_by_id(payload["sub"])
