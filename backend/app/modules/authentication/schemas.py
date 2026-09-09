"""Pydantic schemas for authentication."""
from typing import Optional, Literal


from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Register a new account — role chosen once at registration."""
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["seller", "buyer"] = Field(..., description="Role picker shown at registration")
    full_name: Optional[str] = None
    phone: Optional[str] = None

    # Seller-only fields
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    license_number: Optional[str] = None

    # Buyer-only fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None


class LoginRequest(BaseModel):
    """Login with email/phone and password."""
    identifier: str = Field(..., description="Email or phone number")
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    role: str
    seller_id: Optional[str] = None
    buyer_id: Optional[str] = None
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