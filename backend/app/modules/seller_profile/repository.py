"""
Seller Profile Repository — database operations only.
"""

from typing import Optional


from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.seller_profile.models import SellerProfile, SellerVerification


class SellerProfileRepository:
    """Repository for seller_profiles table."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: int, data: dict) -> SellerProfile:
        """Create a new seller profile."""
        profile = SellerProfile(user_id=user_id, **data)
        self.db.add(profile)
        await self.db.flush()
        await self.db.refresh(profile)
        return profile

    async def get_by_id(self, profile_id: int) -> Optional[SellerProfile]:
        """Get seller profile by ID."""
        result = await self.db.execute(
            select(SellerProfile).where(SellerProfile.id == profile_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: int) -> Optional[SellerProfile]:
        """Get seller profile by user ID."""
        result = await self.db.execute(
            select(SellerProfile).where(SellerProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def update(self, profile_id: int, data: dict) -> Optional[SellerProfile]:
        """Update seller profile fields."""
        await self.db.execute(
            update(SellerProfile)
            .where(SellerProfile.id == profile_id)
            .values(**data)
        )
        await self.db.flush()
        return await self.get_by_id(profile_id)

    async def update_status(self, profile_id: int, status: str) -> Optional[SellerProfile]:
        """Update verification status."""
        await self.db.execute(
            update(SellerProfile)
            .where(SellerProfile.id == profile_id)
            .values(verification_status=status)
        )
        await self.db.flush()
        return await self.get_by_id(profile_id)


class SellerVerificationRepository:
    """Repository for seller_verifications table."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, seller_id: int, data: dict) -> SellerVerification:
        """Create a verification record."""
        verification = SellerVerification(seller_id=seller_id, **data)
        self.db.add(verification)
        await self.db.flush()
        await self.db.refresh(verification)
        return verification

    async def get_by_seller(self, seller_id: int) -> list[SellerVerification]:
        """Get all verification records for a seller."""
        result = await self.db.execute(
            select(SellerVerification)
            .where(SellerVerification.seller_id == seller_id)
            .order_by(SellerVerification.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, verification_id: int, data: dict) -> Optional[SellerVerification]:
        """Update a verification record."""
        await self.db.execute(
            update(SellerVerification)
            .where(SellerVerification.id == verification_id)
            .values(**data)
        )
        await self.db.flush()
        result = await self.db.execute(
            select(SellerVerification).where(SellerVerification.id == verification_id)
        )
        return result.scalar_one_or_none()
