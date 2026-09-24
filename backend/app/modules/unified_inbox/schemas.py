from datetime import datetime
from typing import Optional, List, Literal


from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    buyer_id: int = Field(..., description="Existing buyer profile id")


class ConversationResponse(BaseModel):
    id: str
    seller_id: int
    buyer_id: int
    customer_name: Optional[str] = None
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    status: str = "active"
    created_at: Optional[datetime] = None


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    message_type: Literal["text", "attachment"] = "text"
    source: Literal["in_app", "gmail", "outlook"] = "in_app"
    client_message_id: Optional[str] = Field(
        None, description="Client-generated id for idempotent sends (retries don't duplicate)"
    )
    attachments: List[str] = Field(default_factory=list)


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: int
    sender_type: str
    sender_name: Optional[str] = None
    content: str
    message_type: str = "text"
    source: str = "in_app"
    sentiment: Optional[dict] = None
    translated_content: Optional[str] = None
    translated_language: Optional[str] = None
    sequence_number: int
    attachments: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    is_ai_generated: bool = False


class MessagePage(BaseModel):
    items: List[MessageResponse]
    next_cursor: Optional[str] = None
    limit: int


class TypingEvent(BaseModel):
    conversation_id: str
    is_typing: bool