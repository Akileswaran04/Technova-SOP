"""Pydantic schemas for admin module."""
from datetime import datetime
from typing import Optional, List, Literal


from pydantic import BaseModel, Field


class VerificationResponse(BaseModel):
    """Seller verification record for review."""
    id: int
    seller_id: int
    business_name: Optional[str] = None
    verification_type: str
    document_reference: Optional[str]
    status: str
    submitted_at: Optional[datetime] = None


class VerificationDecision(BaseModel):
    """Approve or reject a seller verification."""
    decision: Literal["approved", "rejected"]
    reason: Optional[str] = Field(None, max_length=1000)


class AuditLogResponse(BaseModel):
    """Audit log entry."""
    id: int
    user_id: Optional[int]
    action: str
    resource_type: str
    resource_id: Optional[int]
    changes: Optional[str]
    created_at: Optional[datetime] = None