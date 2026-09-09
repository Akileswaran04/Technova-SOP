"""Unified Inbox Service — business logic layer (MongoDB-backed)."""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.redis.realtime import RealtimeService
from app.infrastructure.mongodb.chat import utcnow
from app.modules.unified_inbox.repository import (
    ConversationRepository, MessageRepository, serialize,
)
from app.modules.seller_profile.models import SellerProfile
from app.modules.buyer_profile.models import BuyerProfile
from app.modules.unified_inbox.schemas import ConversationCreate, MessageCreate
from app.modules.ai_communication.sentiment import analyze_message
from app.core.exceptions import NotFoundException, ForbiddenException, ValidationException


class InboxService:
    """Business logic for unified inbox."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.convo_repo = ConversationRepository()
        self.msg_repo = MessageRepository()

    # ── Participant resolution ──

    async def _resolve_participant(self, user_id: int, user_role: str) -> int:
        """Resolve the caller's seller or buyer profile id."""
        if user_role == "seller":
            result = await self.db.execute(
                select(SellerProfile).where(SellerProfile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()
        elif user_role == "buyer":
            result = await self.db.execute(
                select(BuyerProfile).where(BuyerProfile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()
        else:
            raise ForbiddenException("Only sellers and buyers can use chat")
        if not profile:
            raise NotFoundException("Profile", str(user_id))
        return profile.id

    async def _assert_participant(
        self, user_id: int, user_role: str, conversation: dict
    ) -> None:
        """RBAC — only conversation participants may read/write it."""
        participant_id = await self._resolve_participant(user_id, user_role)
        field = "sellerId" if user_role == "seller" else "buyerId"
        if conversation.get(field) != participant_id:
            raise ForbiddenException("Not a participant in this conversation")

    def _other_participant(self, conversation: dict, participant_id: int, user_role: str) -> int:
        return conversation["buyerId"] if user_role == "seller" else conversation["sellerId"]

    async def _buyer_name(self, buyer_id: int) -> Optional[str]:
        result = await self.db.execute(
            select(BuyerProfile).where(BuyerProfile.id == buyer_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return None
        return f"{profile.first_name} {profile.last_name}".strip()

    # ── Conversations ──

    async def get_or_create_conversation(
        self, user_id: int, user_role: str, data: ConversationCreate
    ) -> dict:
        """Open (or reuse) a conversation between the caller and a buyer."""
        if user_role == "buyer":
            buyer_id = await self._resolve_participant(user_id, user_role)
            # Buyer can only open a conversation with a real seller
            seller_result = await self.db.execute(
                select(SellerProfile).where(SellerProfile.id == data.buyer_id)
            )
            if seller_result.scalar_one_or_none() is None:
                raise NotFoundException("Seller", str(data.buyer_id))
            seller_id = data.buyer_id
        else:
            seller_id = await self._resolve_participant(user_id, user_role)
            buyer_result = await self.db.execute(
                select(BuyerProfile).where(BuyerProfile.id == data.buyer_id)
            )
            if buyer_result.scalar_one_or_none() is None:
                raise NotFoundException("BuyerProfile", str(data.buyer_id))
            buyer_id = data.buyer_id

        convo = await self.convo_repo.get_or_create(seller_id, buyer_id)
        return await self._to_response(convo)

    async def list_conversations(
        self, user_id: int, user_role: str, cursor: Optional[str] = None, limit: int = 50
    ) -> dict:
        participant_id = await self._resolve_participant(user_id, user_role)
        docs, next_cursor = await self.convo_repo.list_for_participant(
            participant_id, user_role, cursor=cursor, limit=limit
        )
        items = []
        for convo in docs:
            item = await self._to_response(convo)
            if user_role == "seller":
                item["customer_name"] = await self._buyer_name(convo["buyerId"])
            items.append(item)
        return {"items": items, "next_cursor": next_cursor, "limit": limit}

    async def get_conversation(self, conversation_id: str, user_id: int, user_role: str) -> dict:
        convo = await self.convo_repo.get_by_id(conversation_id)
        if not convo:
            raise NotFoundException("Conversation", conversation_id)
        await self._assert_participant(user_id, user_role, convo)
        response = await self._to_response(convo)
        if user_role == "seller":
            response["customer_name"] = await self._buyer_name(convo["buyerId"])
        return response

    async def _to_response(self, convo: dict) -> dict:
        serialized = serialize(convo)
        return {
            "id": serialized["id"],
            "seller_id": convo.get("sellerId"),
            "buyer_id": convo.get("buyerId"),
            "customer_name": None,
            "last_message": convo.get("lastMessage"),
            "last_message_at": convo.get("lastMessageAt"),
            "unread_count": convo.get("unreadCount", 0),
            "status": convo.get("status", "active"),
            "created_at": convo.get("createdAt"),
        }

    # ── Messages ──

    async def list_messages(
        self,
        conversation_id: str,
        user_id: int,
        user_role: str,
        cursor: Optional[str] = None,
        limit: int = 50,
        after_sequence: Optional[int] = None,
    ) -> dict:
        convo = await self.convo_repo.get_by_id(conversation_id)
        if not convo:
            raise NotFoundException("Conversation", conversation_id)
        await self._assert_participant(user_id, user_role, convo)

        docs, next_cursor = await self.msg_repo.get_page(
            conversation_id, cursor=cursor, limit=limit, after_sequence=after_sequence
        )
        return {
            "items": [self._msg_response(d) for d in docs],
            "next_cursor": next_cursor,
            "limit": limit,
        }

    async def send_message(
        self,
        conversation_id: str,
        user_id: int,
        user_role: str,
        data: MessageCreate,
    ) -> dict:
        """Persist a message, enrich with AI, publish realtime, ack sender.

        Idempotent: a retried send with the same client_message_id returns the
        original message instead of duplicating it.
        """
        convo = await self.convo_repo.get_by_id(conversation_id)
        if not convo:
            raise NotFoundException("Conversation", conversation_id)
        await self._assert_participant(user_id, user_role, convo)
        participant_id = await self._resolve_participant(user_id, user_role)
        recipient_id = self._other_participant(convo, participant_id, user_role)

        # Idempotency check
        if data.client_message_id:
            existing = await self.msg_repo.find_by_client_message_id(data.client_message_id)
            if existing:
                return self._msg_response(existing)

        sequence = await self.msg_repo.next_sequence(conversation_id)
        sentiment = analyze_message(data.content)

        doc = {
            "conversationId": convo["_id"],
            "senderId": participant_id,
            "senderType": user_role,
            "senderName": None,
            "content": data.content,
            "messageType": data.message_type,
            "source": data.source,
            "sentiment": sentiment,
            "sequenceNumber": sequence,
            "attachments": data.attachments,
            "createdAt": utcnow(),
            "readAt": None,
            "isAiGenerated": False,
        }
        # Sparse unique index on clientMessageId: omit the field when unset,
        # otherwise nulls collide and every message without an id would fail.
        if data.client_message_id:
            doc["clientMessageId"] = data.client_message_id
        saved = await self.msg_repo.create(doc)

        # Update conversation summary + unread for the recipient
        await self.convo_repo.update_last_message(conversation_id, data.content, recipient_id)
        await self.convo_repo.increment_unread(conversation_id, recipient_id)

        # Realtime delivery via Redis pub/sub
        payload = {"message": self._msg_response(saved)}
        await RealtimeService.publish(conversation_id, "message:new", payload)
        await RealtimeService.publish(
            f"user:{recipient_id}", "message:new", {"conversation_id": conversation_id}
        )

        return self._msg_response(saved)

    def _msg_response(self, doc: dict) -> dict:
        serialized = serialize(doc)
        return {
            "id": serialized["id"],
            "conversation_id": serialized.get("conversation_id") or str(doc.get("conversationId", "")),
            "sender_id": doc.get("senderId"),
            "sender_type": doc.get("senderType"),
            "sender_name": doc.get("senderName"),
            "content": doc.get("content"),
            "message_type": doc.get("messageType", "text"),
            "source": doc.get("source", "in_app"),
            "sentiment": doc.get("sentiment"),
            "sequence_number": doc.get("sequenceNumber"),
            "attachments": doc.get("attachments", []),
            "created_at": doc.get("createdAt"),
            "read_at": doc.get("readAt"),
            "is_ai_generated": doc.get("isAiGenerated", False),
        }

    async def mark_read(self, conversation_id: str, user_id: int, user_role: str) -> dict:
        convo = await self.convo_repo.get_by_id(conversation_id)
        if not convo:
            raise NotFoundException("Conversation", conversation_id)
        await self._assert_participant(user_id, user_role, convo)
        participant_id = await self._resolve_participant(user_id, user_role)
        await self.convo_repo.mark_read(conversation_id, participant_id)
        return {"conversation_id": conversation_id, "unread_count": 0}