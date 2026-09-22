"""Pydantic schemas for human approval of AI-drafted replies."""
from datetime import datetime
from typing import Optional, Literal, List


from pydantic import BaseModel, Field


class DraftCreate(BaseModel):
    """Generate a draft for a conversation."""
    conversation_id: str = Field(..., description="Mongo conversation id")
    reply_to_message_id: Optional[str] = None


class DraftUpdate(BaseModel):
    """Edit a draft before approving."""
    content: str = Field(..., min_length=1, max_length=4000)


class DraftStatusUpdate(BaseModel):
    """Approve or reject a draft."""
    status: Literal["approved", "rejected"]


class DraftResponse(BaseModel):
    """AI draft document."""
    id: str
    conversation_id: str
    seller_id: int
    reply_to_message_id: Optional[str] = None
    original_message: Optional[str] = None
    intent: Optional[str] = None
    sentiment_label: Optional[str] = None
    lead_score: Optional[int] = None
    draft_content: str
    status: str = "pending"  # pending | approved | rejected | sent
    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None