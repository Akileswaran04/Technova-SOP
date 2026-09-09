"""Buyer Profile Service — business logic layer."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.buyer_profile.repository import BuyerProfileRepository
from app.modules.buyer_profile.schemas import BuyerProfileUpdate
from app.core.exceptions import NotFoundException, ValidationException


class BuyerProfileService:
    """Business logic for buyer profiles."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BuyerProfileRepository(db)

    async def get_own_profile(self, user_id: int) -> dict:
        profile = await self.repo.get_by_user_id(user_id)
        if not profile:
            raise NotFoundException("BuyerProfile", str(user_id))
        return profile

    async def get_profile(self, buyer_id: int) -> dict:
        profile = await self.repo.get_by_id(buyer_id)
        if not profile:
            raise NotFoundException("BuyerProfile", str(buyer_id))
        return profile

    async def update_own_profile(self, user_id: int, data: BuyerProfileUpdate) -> dict:
        profile = await self.repo.get_by_user_id(user_id)
        if not profile:
            raise NotFoundException("BuyerProfile", str(user_id))

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise ValidationException("No fields to update")

        updated = await self.repo.update(profile.id, update_data)
        return updated