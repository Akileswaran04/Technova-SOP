"""Pydantic schemas for product listing module."""
from datetime import datetime
from typing import Optional, List


from pydantic import BaseModel, Field


# ── Review Schemas ──

class ReviewCreate(BaseModel):
    """Create a product review."""
    customer_name: str = Field(..., min_length=1, max_length=255)
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    """Product review response."""
    id: int
    product_id: int
    customer_name: str
    rating: int
    comment: Optional[str]
    seller_reply: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewReply(BaseModel):
    """Seller reply to a review."""
    seller_reply: str = Field(..., min_length=1)


# ── Product Schemas ──

class ProductCreate(BaseModel):
    """Create a new product."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field("general", min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    image_url: Optional[str] = None
    stock: int = Field(0, ge=0)
    low_stock_threshold: int = Field(5, ge=0)


class ProductUpdate(BaseModel):
    """Update an existing product."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    image_url: Optional[str] = None
    stock: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    likes: Optional[int] = Field(None, ge=0)


class ProductResponse(BaseModel):
    """Product response with reviews."""
    id: int
    seller_id: int
    name: str
    description: Optional[str]
    category: str
    price: float
    image_url: Optional[str]
    stock: int
    low_stock_threshold: int
    likes: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True


class StockUpdate(BaseModel):
    """Adjust stock quantity."""
    delta: int = Field(..., description="Amount to add (positive) or subtract (negative)")


class LikeResponse(BaseModel):
    """Like toggle response."""
    likes: int
    liked: bool
