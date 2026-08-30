"""Unified Inbox Service — business logic layer."""
from datetime import datetime, timezone


from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.unified_inbox.repository import ConversationRepository, MessageRepository
from app.modules.seller_profile.models import SellerProfile
from app.modules.unified_inbox.schemas import (
    ConversationCreate, ConversationUpdate, MessageCreate,
)
from app.core.exceptions import NotFoundException


class InboxService:
    """Business logic for unified inbox."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.convo_repo = ConversationRepository(db)
        self.msg_repo = MessageRepository(db)

    async def _get_seller_id_from_user(self, user_id: int) -> int:
        """Resolve seller_profile UUID from user UUID."""
        result = await self.db.execute(
            select(SellerProfile).where(SellerProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundException("SellerProfile", str(user_id))
        return profile.id

    async def create_conversation(self, user_id: int, data: ConversationCreate) -> dict:
        seller_id = await self._get_seller_id_from_user(user_id)
        conversation = await self.convo_repo.create(
            seller_id=seller_id,
            data=data.model_dump(exclude_unset=True),
        )
        return conversation

    async def get_conversation(self, conversation_id: int) -> dict:
        conversation = await self.convo_repo.get_by_id(conversation_id)
        if not conversation:
            raise NotFoundException("Conversation", str(conversation_id))
        return conversation

    async def get_conversations_by_seller(self, user_id: int) -> list:
        seller_id = await self._get_seller_id_from_user(user_id)
        return await self.convo_repo.get_by_seller(seller_id)

    async def update_conversation(self, conversation_id: int, data: ConversationUpdate) -> dict:
        conversation = await self.convo_repo.get_by_id(conversation_id)
        if not conversation:
            raise NotFoundException("Conversation", str(conversation_id))

        update_data = data.model_dump(exclude_unset=True)
        updated = await self.convo_repo.update(conversation_id, update_data)
        return updated

    async def send_message(self, conversation_id: int, data: MessageCreate) -> dict:
        conversation = await self.convo_repo.get_by_id(conversation_id)
        if not conversation:
            raise NotFoundException("Conversation", str(conversation_id))

        # Create message
        message = await self.msg_repo.create(
            conversation_id=conversation_id,
            data=data.model_dump(),
        )

        # Update conversation metadata
        now = datetime.now(timezone.utc)
        update_fields = {
            "last_message": data.text,
            "last_message_at": now,
        }
        if data.sender_type == "customer":
            update_fields["unread_count"] = conversation.unread_count + 1

        await self.convo_repo.update(conversation_id, update_fields)

        return message

    async def mark_as_read(self, conversation_id: int) -> None:
        conversation = await self.convo_repo.get_by_id(conversation_id)
        if not conversation:
            raise NotFoundException("Conversation", str(conversation_id))
        await self.msg_repo.mark_conversation_read(conversation_id)

    async def get_total_unread(self, user_id: int) -> int:
        seller_id = await self._get_seller_id_from_user(user_id)
        return await self.convo_repo.get_total_unread(seller_id)
