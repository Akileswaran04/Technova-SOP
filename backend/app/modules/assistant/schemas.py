"""Pydantic schemas for the assistant module."""
from typing import Optional, List

from pydantic import BaseModel, Field

from app.modules.recommendation.schemas import RecommendedItem


class UnderstandRequest(BaseModel):
    """A buyer's free-text (or transcribed voice) requirement."""
    text: str = Field(..., min_length=1, max_length=500)


class RequirementExtraction(BaseModel):
    category: Optional[str] = None
    color: Optional[str] = None
    budget: Optional[float] = None
    use_case: Optional[str] = None


class UnderstandResponse(BaseModel):
    """Either a confident extraction + recommendations, or a single
    clarifying question — never a long form (PRD §8)."""
    understood: bool
    extraction: Optional[RequirementExtraction] = None
    question: Optional[str] = None
    recommendations: List[RecommendedItem] = Field(default_factory=list)


class VoiceRequest(BaseModel):
    """A transcribed voice query (browser does STT) plus its spoken language."""
    text: str = Field(..., min_length=1, max_length=500)
    source_language: str = Field("en", max_length=30, description="e.g. 'en', 'ta', 'Tamil', 'Tanglish'")


class VoiceResponse(UnderstandResponse):
    """Same as guided-buying text understanding, plus a reply to speak back
    to the user in their own language (browser does TTS)."""
    spoken_reply: str
    spoken_reply_language: str
