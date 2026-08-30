"""Unified Inbox Repository — database operations only."""
from typing import Optional


from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.seller_profile.models import Conversation, Message


class ConversationRepository:
    """Repository for conversations table."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, seller_id: int, data: dict) -> Conversation:
        conversation = Conversation(seller_id=seller_id, **data)
        self.db.add(conversation)
        await self.db.flush()
        await self.db.refresh(conversation)
        return conversation

    async def get_by_id(self, conversation_id: int) -> Optional[Conversation]:
        result = await self.db.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def get_by_seller(self, seller_id: int) -> list[Conversation]:
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.seller_id == seller_id)
            .order_by(Conversation.last_message_at.desc().nulls_last())
        )
        return list(result.scalars().all())

    async def update(self, conversation_id: int, data: dict) -> Optional[Conversation]:
        await self.db.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(**data)
        )
        await self.db.flush()
        return await self.get_by_id(conversation_id)

    async def get_total_unread(self, seller_id: int) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.sum(Conversation.unread_count), 0))
            .where(Conversation.seller_id == seller_id)
        )
        return result.scalar()


class MessageRepository:
    """Repository for messages table."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, conversation_id: int, data: dict) -> Message:
        message = Message(conversation_id=conversation_id, **data)
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message

    async def get_by_conversation(self, conversation_id: int) -> list[Message]:
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        return list(result.scalars().all())

    async def mark_conversation_read(self, conversation_id: int) -> None:
        await self.db.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(unread_count=0)
        )
        await self.db.flush()
