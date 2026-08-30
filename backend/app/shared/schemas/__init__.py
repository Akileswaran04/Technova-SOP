"""
Shared Pydantic schemas for TECHNOVA.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class BaseResponse(BaseModel):
    """Base response schema."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginationParams(BaseModel):
    """Pagination query parameters."""
    page: int = 1
    page_size: int = 20


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
