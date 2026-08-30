"""Unified Inbox Router — HTTP endpoints only."""
from typing import List


from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user_id
from app.modules.unified_inbox.dependencies import get_inbox_service
from app.modules.unified_inbox.schemas import (
    ConversationCreate, ConversationUpdate, ConversationResponse,
    ConversationDetailResponse, MessageCreate, MessageResponse, UnreadCountResponse,
)
from app.modules.unified_inbox.service import InboxService

router = APIRouter()


# ── Conversations ──

@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    user_id: str = Depends(get_current_user_id),
    service: InboxService = Depends(get_inbox_service),
):
    """List all conversations for the current seller."""
    return await service.get_conversations_by_seller(int(user_id))


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    user_id: str = Depends(get_current_user_id),
    service: InboxService = Depends(get_inbox_service),
):
    """Create a new conversation."""
    return await service.create_conversation(int(user_id), data)


@router.get("/unread", response_model=UnreadCountResponse)
async def get_unread_count(
    user_id: str = Depends(get_current_user_id),
    service: InboxService = Depends(get_inbox_service),
):
    """Get total unread message count."""
    total = await service.get_total_unread(int(user_id))
    return UnreadCountResponse(total=total)


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: int,
    service: InboxService = Depends(get_inbox_service),
):
    """Get a conversation with full message history."""
    return await service.get_conversation(conversation_id)


@router.put("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: int,
    data: ConversationUpdate,
    service: InboxService = Depends(get_inbox_service),
):
    """Update conversation metadata."""
    return await service.update_conversation(conversation_id, data)


# ── Messages ──

@router.post("/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: int,
    data: MessageCreate,
    service: InboxService = Depends(get_inbox_service),
):
    """Send a message in a conversation."""
    return await service.send_message(conversation_id, data)


@router.patch("/{conversation_id}/read")
async def mark_as_read(
    conversation_id: int,
    service: InboxService = Depends(get_inbox_service),
):
    """Mark conversation as read."""
    await service.mark_as_read(conversation_id)
    return {"status": "ok"}
