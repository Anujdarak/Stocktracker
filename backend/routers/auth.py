from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

try:
    from backend.services.auth import (
        create_user,
        authenticate_user,
        get_current_user
    )
except ImportError:
    from services.auth import (
        create_user,
        authenticate_user,
        get_current_user
    )

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(payload: RegisterRequest):
    """
    Sign Up / Create Account endpoint.
    Validates required fields, password matching, email format, and uniqueness in MongoDB.
    """
    result = create_user(
        name=payload.name,
        email=payload.email,
        password=payload.password,
        confirm_password=payload.confirm_password
    )
    return {
        "status": "success",
        "message": "Account created successfully.",
        "data": result
    }


@router.post("/login")
def login(payload: LoginRequest):
    """
    Sign In / Login endpoint.
    Verifies credentials securely against MongoDB and issues a signed JWT session token.
    """
    result = authenticate_user(email=payload.email, password=payload.password)
    return {
        "status": "success",
        "message": "Logged in successfully.",
        "data": result
    }


@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout endpoint.
    Invalidates client session state and logs sign out event.
    """
    return {
        "status": "success",
        "message": "Logged out successfully."
    }


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get Current Authenticated User.
    Returns user profile without exposing password hashes.
    """
    return {
        "status": "success",
        "data": current_user
    }
