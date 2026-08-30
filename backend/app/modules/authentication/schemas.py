"""Pydantic schemas for authentication."""
from typing import Optional


from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Register a new seller account."""
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    """Login with email/phone and password."""
    identifier: str = Field(..., description="Email or phone number")
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    seller_id: str
    email: Optional[str]
    full_name: Optional[str]


class SellerProfileResponse(BaseModel):
    """Seller profile data returned after login."""
    id: str
    store_name: Optional[str]
    category: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    description: Optional[str]
    avatar_image: Optional[str]
    is_verified: bool
    created_at: Optional[str]
