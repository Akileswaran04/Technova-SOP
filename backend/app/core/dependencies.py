"""
Core dependency injection for FastAPI.
"""

from typing import AsyncGenerator

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.infrastructure.postgres.session import get_db_session


async def get_current_user_id(
    authorization: str = Header(None),
) -> str:
    """Extract and validate user ID from JWT token."""
    if not authorization:
        raise Exception("Authorization header required")

    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)

    if payload is None:
        raise Exception("Invalid or expired token")

    user_id = payload.get("sub")
    if user_id is None:
        raise Exception("Token missing user ID")

    return user_id


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get async database session."""
    async for session in get_db_session():
        yield session
