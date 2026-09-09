"""Pydantic schemas for the api_integration module."""
from typing import List, Optional

from pydantic import BaseModel, Field


class IntegrationConnectResponse(BaseModel):
    """Response to a connect request — the OAuth authorization URL to open."""
    service: str
    auth_url: str
    state: str
    mode: str = Field(..., description="'oauth' when provider credentials are configured, 'mock' otherwise")


class IntegrationStatus(BaseModel):
    """Status of one connected (or connectable) service."""
    service: str
    connected: bool
    provider_account: Optional[str] = None
    scopes: Optional[str] = None
    expires_at: Optional[str] = None


class IntegrationListResponse(BaseModel):
    items: List[IntegrationStatus]


class SyncResponse(BaseModel):
    """Result of a manual sync of the external inbox into the unified inbox."""
    service: str
    created: int
    source: str
    conversation_id: Optional[str] = None
    message_ids: List[str] = []
    note: Optional[str] = None