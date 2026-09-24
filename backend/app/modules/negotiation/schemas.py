"""Pydantic schemas for the negotiation module."""
from datetime import datetime
from typing import Optional, Literal, List

from pydantic import BaseModel, Field


class NegotiationRuleUpsert(BaseModel):
    """Seller configures negotiation for one product."""
    enabled: bool = True
    min_price: float = Field(..., ge=0)
    auto_accept_threshold: Optional[float] = Field(None, ge=0)
    counter_offer_range_pct: float = Field(10.0, ge=0, le=100)
    max_rounds: int = Field(2, ge=1, le=10)
    quantity_discount_rules: Optional[dict] = None


class NegotiationRuleResponse(BaseModel):
    """Seller's own view of their negotiation rule (confidential fields included)."""
    id: int
    product_id: int
    enabled: bool
    min_price: float
    auto_accept_threshold: Optional[float]
    counter_offer_range_pct: float
    max_rounds: int
    quantity_discount_rules: Optional[dict]


class NegotiationSuggestionResponse(BaseModel):
    """Buyer-facing suggested offer — never reveals the seller's price floor directly."""
    product_id: int
    listed_price: float
    suggested_price: float
    quantity: int
    negotiation_enabled: bool


class OfferCreate(BaseModel):
    """Buyer submits an offer (must have explicitly approved this price first)."""
    product_id: int
    quantity: int = Field(1, ge=1)
    offered_price: float = Field(..., ge=0)
    message: Optional[str] = Field(None, max_length=500)


class OfferRespondRequest(BaseModel):
    """Seller responds to a pending offer."""
    action: Literal["accept", "reject", "counter"]
    counter_price: Optional[float] = Field(None, ge=0)
    message: Optional[str] = Field(None, max_length=500)


class OfferResponse(BaseModel):
    """One offer/counter-offer."""
    id: int
    product_id: int
    product_name: Optional[str] = None
    buyer_id: int
    seller_id: int
    round: int
    quantity: int
    offered_price: float
    offered_by: str
    status: str
    message: Optional[str]
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    fulfilled_order_id: Optional[int] = None


class OfferCheckoutRequest(BaseModel):
    """Check out an accepted offer at its negotiated price."""
    address_id: int
    payment_method: Optional[str] = "mock"
    notes: Optional[str] = Field(None, max_length=500)
