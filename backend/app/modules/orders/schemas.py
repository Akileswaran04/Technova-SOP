"""Pydantic schemas for orders module."""
from datetime import datetime
from typing import Optional, List, Literal


from pydantic import BaseModel, Field


class OrderItemCreate(BaseModel):
    """A product line in an order."""
    product_id: int
    quantity: int = Field(..., ge=1)


class OrderCreate(BaseModel):
    """Create an order from product line items."""
    items: List[OrderItemCreate] = Field(..., min_length=1)
    shipping_address: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    payment_method: Optional[str] = "mock"


class OrderItemResponse(BaseModel):
    """Order line item."""
    id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float


class OrderResponse(BaseModel):
    """Order response with items and payment/transaction refs."""
    id: int
    order_number: str
    buyer_id: int
    seller_id: int
    status: str
    total_amount: float
    currency: str
    payment_method: Optional[str]
    shipping_address: Optional[str]
    notes: Optional[str]
    items: List[OrderItemResponse] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class OrderStatusUpdate(BaseModel):
    """Seller updates order status (state machine)."""
    status: Literal["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"]


class OrderReviewCreate(BaseModel):
    """Buyer review after an order."""
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    comment: Optional[str] = None