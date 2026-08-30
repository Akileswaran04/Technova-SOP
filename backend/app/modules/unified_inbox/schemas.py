"""Pydantic schemas for unified inbox module."""
from datetime import datetime
from typing import Optional, List, Any


from pydantic import BaseModel, Field


# ── Message Schemas ──

class MessageCreate(BaseModel):
    """Create a new message."""
    sender_type: str = Field(..., pattern="^(seller|customer|ai)$")
    sender_name: Optional[str] = None
    text: str = Field(..., min_length=1)
    is_ai_generated: bool = False
    order_data: Optional[dict] = None


class MessageResponse(BaseModel):
    """Message response."""
    id: int
    conversation_id: int
    sender_type: str
    sender_name: Optional[str]
    text: str
    is_ai_generated: bool
    order_data: Optional[Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Conversation Schemas ──

class ConversationCreate(BaseModel):
    """Create a new conversation."""
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    order_tag: Optional[str] = None


class ConversationUpdate(BaseModel):
    """Update conversation metadata."""
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    order_tag: Optional[str] = None


class ConversationResponse(BaseModel):
    """Conversation response with last message info."""
    id: int
    seller_id: int
    customer_name: str
    customer_phone: Optional[str]
    customer_email: Optional[str]
    last_message: Optional[str]
    last_message_at: Optional[datetime]
    unread_count: int
    order_tag: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    """Conversation with full message history."""
    messages: List[MessageResponse] = []


class UnreadCountResponse(BaseModel):
    """Total unread count for a seller."""
    total: int
