"""Buyer Profile Repository — database operations only."""
from typing import Optional


from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.buyer_profile.models import BuyerProfile


class BuyerProfileRepository:
    """Repository for buyer_profiles table."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_id(self, user_id: int) -> Optional[BuyerProfile]:
        result = await self.db.execute(
            select(BuyerProfile).where(BuyerProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, buyer_id: int) -> Optional[BuyerProfile]:
        result = await self.db.execute(
            select(BuyerProfile).where(BuyerProfile.id == buyer_id)
        )
        return result.scalar_one_or_none()

    async def update(self, buyer_id: int, data: dict) -> Optional[BuyerProfile]:
        await self.db.execute(
            update(BuyerProfile)
            .where(BuyerProfile.id == buyer_id)
            .values(**data)
        )
        await self.db.flush()
        return await self.get_by_id(buyer_id)