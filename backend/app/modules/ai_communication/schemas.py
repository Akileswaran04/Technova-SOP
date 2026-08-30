"""Pydantic schemas for AI communication module."""
from datetime import datetime
from typing import Optional, List


from pydantic import BaseModel, Field


class AIInteractionCreate(BaseModel):
    """Log an AI interaction."""
    conversation_id: Optional[int] = None
    message_text: str = Field(..., min_length=1)
    emotion: Optional[str] = None
    strategy: Optional[str] = None
    lead_score: Optional[int] = None
    ai_response: Optional[str] = None
    was_sent: bool = False
    was_edited: bool = False


class AIInteractionResponse(BaseModel):
    """AI interaction response."""
    id: int
    conversation_id: Optional[int]
    seller_id: int
    message_text: str
    emotion: Optional[str]
    strategy: Optional[str]
    lead_score: Optional[int]
    ai_response: Optional[str]
    was_sent: bool
    was_edited: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AIStatsResponse(BaseModel):
    """AI communication statistics."""
    total_interactions: int
    total_sent: int
    total_edited: int
    avg_lead_score: Optional[float]
    emotion_distribution: dict
    strategy_distribution: dict
