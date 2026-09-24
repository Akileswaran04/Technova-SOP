"""Pydantic schemas for the cart module."""
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class CartItemCreate(BaseModel):
    """Add a product to the cart (or bump quantity if already present)."""
    product_id: int
    quantity: int = Field(1, ge=1)


class CartItemUpdate(BaseModel):
    """Set a cart item's quantity."""
    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    """A cart line, with enough product info to render without a second fetch."""
    id: int
    product_id: int
    product_name: str
    product_image_url: Optional[str] = None
    unit_price: float
    seller_id: int
    available_stock: int
    quantity: int
    line_total: float
    added_at: Optional[datetime] = None


class CartResponse(BaseModel):
    """The current buyer's cart."""
    id: int
    items: List[CartItemResponse] = Field(default_factory=list)
    subtotal: float
    item_count: int


class CheckoutRequest(BaseModel):
    """Confirm checkout for the current cart."""
    address_id: int
    payment_method: Optional[str] = "mock"
    notes: Optional[str] = Field(None, max_length=500)
