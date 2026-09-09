"""Unified Inbox Repository — MongoDB operations only.

Conversations and messages live in MongoDB; PostgreSQL keeps identity and
financial data. Messages are their own collection (never embedded arrays),
paginated by _id cursor, ordered by sequenceNumber.
"""
from typing import Optional

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING

from app.infrastructure.mongodb.chat import (
    get_conversations_collection,
    get_messages_collection,
    utcnow,
)


def to_str_id(doc) -> Optional[str]:
    return str(doc["_id"]) if doc else None


def serialize(doc) -> dict:
    """Convert a Mongo doc to an API-shaped dict."""
    if not doc:
        return None
    out = {}
    for key, value in doc.items():
        if key == "_id":
            out["id"] = str(value)
        elif key == "conversationId" and value:
            out["conversation_id"] = str(value)
        elif key == "clientMessageId":
            continue
        else:
            out[key] = value
    return out


class ConversationRepository:
    """Mongo repository for conversations."""

    async def get_or_create(self, seller_id: int, buyer_id: int) -> dict:
        """Check-then-create: never duplicate a (sellerId, buyerId) pair.

        Uses an upsert with a unique index as the race-safe fallback.
        """
        convos = await get_conversations_collection()
        now = utcnow()

        existing = await convos.find_one(
            {"sellerId": seller_id, "buyerId": buyer_id}
        )
        if existing:
            return existing

        doc = {
            "sellerId": seller_id,
            "buyerId": buyer_id,
            "status": "active",
            "lastMessage": None,
            "lastMessageAt": None,
            "unreadCount": 0,
            "createdAt": now,
            "updatedAt": now,
        }
        try:
            result = await convos.insert_one(doc)
            return await convos.find_one({"_id": result.inserted_id})
        except Exception:
            # Unique index race — fetch the winner
            return await convos.find_one({"sellerId": seller_id, "buyerId": buyer_id})

    async def get_by_id(self, conversation_id: str) -> Optional[dict]:
        if not ObjectId.is_valid(conversation_id):
            return None
        convos = await get_conversations_collection()
        return await convos.find_one({"_id": ObjectId(conversation_id)})

    async def list_for_participant(
        self, user_id: int, user_role: str, cursor: Optional[str] = None, limit: int = 50
    ) -> tuple[list, Optional[str]]:
        """List conversations for a seller or buyer, cursor-paginated."""
        convos = await get_conversations_collection()
        field = "sellerId" if user_role == "seller" else "buyerId"

        query = {field: user_id}
        if cursor and ObjectId.is_valid(cursor):
            query["_id"] = {"$lt": ObjectId(cursor)}

        docs = await (
            convos.find(query)
            .sort("lastMessageAt", DESCENDING)
            .limit(limit + 1)
            .to_list(length=limit + 1)
        )
        has_more = len(docs) > limit
        docs = docs[:limit]
        next_cursor = str(docs[-1]["_id"]) if has_more and docs else None
        return docs, next_cursor

    async def update_last_message(
        self, conversation_id: str, content: str, recipient_id: int
    ) -> None:
        convos = await get_conversations_collection()
        await convos.update_one(
            {"_id": ObjectId(conversation_id)},
            {
                "$set": {
                    "lastMessage": content,
                    "lastMessageAt": utcnow(),
                    "updatedAt": utcnow(),
                    "unreadFor": recipient_id,
                },
            },
        )

    async def increment_unread(self, conversation_id: str, recipient_id: int) -> None:
        convos = await get_conversations_collection()
        await convos.update_one(
            {"_id": ObjectId(conversation_id)},
            {
                "$inc": {"unreadCount": 1},
                "$set": {"unreadFor": recipient_id, "updatedAt": utcnow()},
            },
        )

    async def mark_read(self, conversation_id: str, reader_id: int) -> None:
        """Reset unread for the reader and stamp readAt on their messages."""
        convos = await get_conversations_collection()
        messages = await get_messages_collection()

        await messages.update_many(
            {
                "conversationId": ObjectId(conversation_id),
                "senderId": {"$ne": reader_id},
                "readAt": None,
            },
            {"$set": {"readAt": utcnow()}},
        )
        await convos.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"unreadCount": 0, "unreadFor": reader_id, "updatedAt": utcnow()}},
        )


class MessageRepository:
    """Mongo repository for messages."""

    async def find_by_client_message_id(self, client_message_id: str) -> Optional[dict]:
        messages = await get_messages_collection()
        return await messages.find_one({"clientMessageId": client_message_id})

    async def next_sequence(self, conversation_id: str) -> int:
        """Deterministic ordering: last sequence + 1 (conversation-scoped)."""
        messages = await get_messages_collection()
        last = await (
            messages.find({"conversationId": ObjectId(conversation_id)})
            .sort("sequenceNumber", DESCENDING)
            .limit(1)
            .to_list(length=1)
        )
        return (last[0]["sequenceNumber"] + 1) if last else 1

    async def create(self, data: dict) -> dict:
        messages = await get_messages_collection()
        result = await messages.insert_one(data)
        return await messages.find_one({"_id": result.inserted_id})

    async def get_page(
        self,
        conversation_id: str,
        cursor: Optional[str] = None,
        limit: int = 50,
        after_sequence: Optional[int] = None,
    ) -> tuple[list, Optional[str]]:
        """Cursor-paginated messages, newest-last within the page."""
        messages = await get_messages_collection()
        query = {"conversationId": ObjectId(conversation_id)}

        if after_sequence is not None:
            # Reconnection sync — return only the gap, not full history
            query["sequenceNumber"] = {"$gt": after_sequence}
            docs = await (
                messages.find(query)
                .sort("sequenceNumber", ASCENDING)
                .to_list(length=limit + 1)
            )
            has_more = len(docs) > limit
            docs = docs[:limit]
            next_cursor = str(docs[-1]["_id"]) if has_more and docs else None
            return docs, next_cursor

        if cursor and ObjectId.is_valid(cursor):
            query["_id"] = {"$lt": ObjectId(cursor)}

        docs = await (
            messages.find(query)
            .sort("_id", DESCENDING)
            .limit(limit + 1)
            .to_list(length=limit + 1)
        )
        has_more = len(docs) > limit
        docs = docs[:limit]
        docs.reverse()  # oldest first within the page, for chat UX
        next_cursor = str(docs[0]["_id"]) if has_more and docs else None
        return docs, next_cursor

    async def mark_ai_generated(self, message_id: str) -> None:
        messages = await get_messages_collection()
        await messages.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"isAiGenerated": True}},
        )