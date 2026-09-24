"""Pydantic schemas for the recommendation module."""
from typing import Optional, List

from pydantic import BaseModel, Field


class RecommendedItem(BaseModel):
    """One ranked, reasoned recommendation."""
    product_id: int
    name: str
    price: float
    image_url: Optional[str] = None
    category: str
    stock: int
    seller_id: int
    seller_name: Optional[str] = None
    trust_score: Optional[float] = None
    tag: str
    reasons: List[str]


class RecommendationResponse(BaseModel):
    """2-3 highly relevant options — never a full list (PRD §9)."""
    items: List[RecommendedItem]


class CompareRequest(BaseModel):
    """Compare 2-3 products the buyer has selected."""
    product_ids: List[int] = Field(..., min_length=2, max_length=3)


class CompareRow(BaseModel):
    """One product's row in the structured comparison table."""
    product_id: int
    name: str
    price: float
    trust_score: Optional[float] = None
    stock: int


class CompareResponse(BaseModel):
    """AI-written summary (the 'work' of comparing) + a server-computed table
    (accuracy — numbers are never left to the LLM)."""
    summary: str
    table: List[CompareRow]
