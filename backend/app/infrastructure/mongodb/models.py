"""MongoDB models for TECHNOVA application.

MongoDB stores high-volume communication data:
- Conversations
- Messages
- AI communication history
- Chat threads
"""
from datetime import datetime
from enum import Enum as PyEnum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class MessageType(str, PyEnum):
    """Types of messages."""

    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    AUDIO = "audio"
    VIDEO = "video"
    SYSTEM = "system"


class ConversationStatus(str, PyEnum):
    """Conversation status."""

    ACTIVE = "active"
    ARCHIVED = "archived"
    CLOSED = "closed"


class ConversationType(str, PyEnum):
    """Type of conversation."""

    DIRECT = "direct"
    GROUP = "group"
    SUPPORT = "support"
    AI_ASSISTANT = "ai_assistant"


# ============================================
# MongoDB Pydantic Models
# ============================================


class Message(BaseModel):
    """Individual message document."""

    id: Optional[str] = Field(default=None, alias="_id")
    conversation_id: str
    sender_id: int  # FK to User
    sender_name: str
    sender_avatar_url: Optional[str] = None
    message_type: MessageType = MessageType.TEXT
    content: str
    attachments: List[Dict[str, Any]] = Field(default_factory=list)
    # Attachments example: [{"type": "image", "url": "...", "size": 1024}]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    # Metadata example: {"ai_processed": True, "sentiment": "positive"}
    is_edited = False
    edited_at: Optional[datetime] = None
    is_deleted = False
    deleted_at: Optional[datetime] = None
    reactions: Dict[str, List[int]] = Field(default_factory=dict)
    # Reactions example: {"👍": [123, 456], "❤️": [789]}
    reply_to_id: Optional[str] = None  # If this is a reply
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "conversation_id": "conv_123",
                "sender_id": 1,
                "sender_name": "John Seller",
                "message_type": "text",
                "content": "Hello, is this product available?",
                "attachments": [],
                "created_at": "2024-01-01T12:00:00",
            }
        }


class MessageThread(BaseModel):
    """Thread of messages (for organizing conversations)."""

    id: Optional[str] = Field(default=None, alias="_id")
    conversation_id: str
    subject: str
    initial_message_id: str
    participants: List[int]  # User IDs
    message_count: int = 0
    last_message_id: Optional[str] = None
    last_message_at: Optional[datetime] = None
    is_pinned: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Conversation(BaseModel):
    """Conversation document - umbrella for messages and threads."""

    id: Optional[str] = Field(default=None, alias="_id")
    conversation_type: ConversationType
    status: ConversationStatus = ConversationStatus.ACTIVE
    participants: List[int]  # User IDs involved in conversation
    participant_names: List[str]
    subject: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    # For direct conversations (1:1 or buyer-seller)
    buyer_id: Optional[int] = None
    seller_id: Optional[int] = None
    product_id: Optional[int] = None
    order_id: Optional[int] = None
    # For group conversations
    created_by: Optional[int] = None
    # Statistics
    message_count: int = 0
    last_message_id: Optional[str] = None
    last_message_content: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_counts: Dict[int, int] = Field(default_factory=dict)
    # unread_counts example: {"123": 5, "456": 0}
    # Settings
    is_muted: Dict[int, bool] = Field(default_factory=dict)
    notification_level: Dict[int, str] = Field(default_factory=dict)
    # notification_level example: {"123": "all", "456": "mentions_only"}
    pinned_messages: List[str] = Field(default_factory=list)
    archived_by: List[int] = Field(default_factory=list)
    # Metadata
    labels: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "conversation_type": "direct",
                "participants": [1, 2],
                "participant_names": ["John Seller", "Jane Buyer"],
                "buyer_id": 2,
                "seller_id": 1,
                "status": "active",
                "message_count": 10,
                "created_at": "2024-01-01T12:00:00",
            }
        }


# ============================================
# AI Communication Models
# ============================================


class AIInteraction(BaseModel):
    """AI communication interaction history."""

    id: Optional[str] = Field(default=None, alias="_id")
    conversation_id: str
    message_id: str  # The user message
    ai_provider: str  # "openai", "huggingface", etc.
    ai_model: str  # "gpt-4", "llama-2", etc.
    input_text: str
    output_text: str
    tokens_used: Dict[str, int] = Field(default_factory=dict)
    # tokens_used example: {"input": 50, "output": 100}
    latency_ms: float
    cost: float
    intent: Optional[str] = None  # "question", "complaint", "order_status", etc.
    sentiment: Optional[str] = None  # "positive", "negative", "neutral"
    language: str = "en"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "conversation_id": "conv_123",
                "ai_provider": "openai",
                "ai_model": "gpt-4",
                "input_text": "Can you help me with my order?",
                "output_text": "I'd be happy to help! What's your order number?",
                "tokens_used": {"input": 10, "output": 15},
                "latency_ms": 450,
                "created_at": "2024-01-01T12:00:00",
            }
        }


class ConversationAnalytics(BaseModel):
    """Analytics for conversations."""

    id: Optional[str] = Field(default=None, alias="_id")
    conversation_id: str
    total_messages: int = 0
    message_types: Dict[str, int] = Field(default_factory=dict)
    # message_types example: {"text": 45, "image": 5, "file": 2}
    average_response_time_seconds: float = 0.0
    participants_count: int = 0
    active_participants: List[int] = Field(default_factory=list)
    sentiment_distribution: Dict[str, float] = Field(default_factory=dict)
    # sentiment_distribution example: {"positive": 0.6, "neutral": 0.3, "negative": 0.1}
    ai_interactions_count: int = 0
    first_message_at: Optional[datetime] = None
    last_message_at: Optional[datetime] = None
    resolution_status: Optional[str] = None  # "resolved", "open", "escalated"
    escalation_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class NotificationQueue(BaseModel):
    """Queue for pending notifications."""

    id: Optional[str] = Field(default=None, alias="_id")
    recipient_id: int  # User ID
    notification_type: str  # "message", "order_update", "system", etc.
    title: str
    body: str
    data: Dict[str, Any] = Field(default_factory=dict)
    related_conversation_id: Optional[str] = None
    related_order_id: Optional[int] = None
    is_read: bool = False
    read_at: Optional[datetime] = None
    priority: str = "normal"  # "low", "normal", "high", "urgent"
    channels: List[str] = Field(default_factory=lambda: ["in_app"])
    # channels example: ["in_app", "email", "push"]
    delivery_attempts: int = 0
    last_delivery_attempt: Optional[datetime] = None
    delivery_failed_reason: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
