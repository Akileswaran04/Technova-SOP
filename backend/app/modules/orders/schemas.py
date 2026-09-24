from datetime import datetime
from typing import Optional, List, Literal


from pydantic import BaseModel, Field


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1)
    shipping_address: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    payment_method: Optional[str] = "mock"


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float


class OrderResponse(BaseModel):
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


OrderStatus = Literal[
    "pending", "confirmed", "shipped", "delivered", "cancelled", "returned",
    "created", "payment_pending", "paid", "seller_confirmed", "processing",
    "packed", "ready_for_pickup", "picked_up", "in_transit",
    "out_for_delivery", "return_requested", "refunded", "delivery_failed",
]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    location: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=500)


class TrackingEventResponse(BaseModel):
    id: int
    order_id: int
    status: str
    actor_role: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None


class OrderReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    comment: Optional[str] = None