"""
MongoDB chat collections — conversations & messages.

Owns the collections' shape and indexes:
- conversations: one per unique (sellerId, buyerId) pair (unique index)
- messages: sequenceNumber ordering, cursor-paginated by _id
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from pymongo import ASCENDING, DESCENDING
from pymongo.results import InsertOneResult

from app.infrastructure.mongodb.database import get_mongodb

logger = logging.getLogger(__name__)

CONVERSATIONS_COLLECTION = "conversations"
MESSAGES_COLLECTION = "messages"
DRAFTS_COLLECTION = "ai_drafts"


async def get_conversations_collection():
    db = await get_mongodb()
    return db[CONVERSATIONS_COLLECTION]


async def get_messages_collection():
    db = await get_mongodb()
    return db[MESSAGES_COLLECTION]


async def get_drafts_collection():
    db = await get_mongodb()
    return db[DRAFTS_COLLECTION]


async def ensure_chat_indexes() -> None:
    """Create required indexes idempotently."""
    convos = await get_conversations_collection()
    messages = await get_messages_collection()
    drafts = await get_drafts_collection()

    # One conversation per unique (sellerId, buyerId) pair — never duplicate
    await convos.create_index(
        [("sellerId", ASCENDING), ("buyerId", ASCENDING)],
        unique=True,
        name="uq_conversation_seller_buyer",
    )
    await convos.create_index([("sellerId", ASCENDING), ("lastMessageAt", DESCENDING)])
    await convos.create_index([("buyerId", ASCENDING), ("lastMessageAt", DESCENDING)])

    # Messages: pagination + ordering indexes
    await messages.create_index(
        [("conversationId", ASCENDING), ("createdAt", ASCENDING)],
        name="ix_messages_conversation_created",
    )
    await messages.create_index(
        [("conversationId", ASCENDING), ("sequenceNumber", ASCENDING)],
        name="ix_messages_conversation_sequence",
        unique=True,
    )
    await messages.create_index(
        [("clientMessageId", ASCENDING)], unique=True, sparse=True
    )

    await drafts.create_index(
        [("conversationId", ASCENDING), ("createdAt", DESCENDING)]
    )
    await drafts.create_index([("status", ASCENDING)])

    logger.info("MongoDB chat indexes ensured")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)