"""Unified Inbox Router — HTTP endpoints (MongoDB chat)."""
from typing import Optional


from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.modules.unified_inbox.dependencies import get_inbox_service
from app.modules.unified_inbox.schemas import (
    ConversationCreate, ConversationResponse, MessageCreate, MessageResponse,
)
from app.modules.unified_inbox.service import InboxService

router = APIRouter()


@router.post("", response_model=ConversationResponse)
async def create_conversation(
    data: ConversationCreate,
    user=Depends(get_current_user),
    service: InboxService = Depends(get_inbox_service),
):
    """Open (or reuse) a conversation with a buyer. One per (seller, buyer) pair."""
    return await service.get_or_create_conversation(user.id, user.role, data)


@router.get("/unread/total")
async def get_unread_total(
    user=Depends(get_current_user),
    service: InboxService = Depends(get_inbox_service),
):
    """Total unread messages across all conversations — single Mongo aggregate.

    Cheap endpoint for nav badges: no conversation rows are fetched or
    serialized, so polling this is far lighter than listing conversations.
    """
    total = await service.get_unread_total(user.id, user.role)
    return {"total": total}


@router.get("")
async def list_conversations(
    cursor: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    user=Depends(get_current_user),
    service: InboxService = Depends(get_inbox_service),
):
    """List conversations for the current seller or buyer."""
    return await service.list_conversations(user.id, user.role, cursor=cursor, limit=limit)


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    user=Depends(get_current_user),
    service: InboxService = Depends(get_inbox_service),
):
    """Get a conversation (participant only)."""
    return await service.get_conversation(conversation_id, user.id, user.role)


@router.get("/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    cursor: Optional[str] = Query(None, description="Opaque _id cursor"),
    limit: int = Query(50, ge=1, le=200),
    user=Depends(get_current_user),
    service: InboxService = Depends(get_inbox_service),
):
    """Cursor-paginated messages — never a full-conversation dump."""
    return await service.list_messages(
        conversation_id, user.id, user.role, cursor=cursor, limit=limit
    )


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    data: MessageCreate,
    user=Depends(get_current_user),
    service: InboxService = Depends(get_inbox_service),
):
    """Send a message — idempotent via client_message_id."""
    return await service.send_message(conversation_id, user.id, user.role, data)


@router.patch("/{conversation_id}/read")
async def mark_read(
    conversation_id: str,
    user=Depends(get_current_user),
    service: InboxService = Depends(get_inbox_service),
):
    """Mark conversation as read for the current participant."""
    return await service.mark_read(conversation_id, user.id, user.role)