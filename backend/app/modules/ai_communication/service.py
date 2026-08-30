"""AI Communication Service — business logic layer."""


from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai_communication.repository import AIInteractionRepository
from app.modules.seller_profile.models import SellerProfile
from app.modules.ai_communication.schemas import AIInteractionCreate
from app.core.exceptions import NotFoundException


class AICommunicationService:
    """Business logic for AI communication logging and stats."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.interaction_repo = AIInteractionRepository(db)

    async def _get_seller_id_from_user(self, user_id: int) -> int:
        """Resolve seller_profile UUID from user UUID."""
        result = await self.db.execute(
            select(SellerProfile).where(SellerProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundException("SellerProfile", str(user_id))
        return profile.id

    async def log_interaction(self, user_id: int, data: AIInteractionCreate) -> dict:
        """Log an AI interaction."""
        seller_id = await self._get_seller_id_from_user(user_id)
        interaction = await self.interaction_repo.create(
            seller_id=seller_id,
            data=data.model_dump(exclude_unset=True),
        )
        return interaction

    async def get_interactions(self, user_id: int, limit: int = 50) -> list:
        """Get recent AI interactions for a seller."""
        seller_id = await self._get_seller_id_from_user(user_id)
        return await self.interaction_repo.get_by_seller(seller_id, limit)

    async def get_stats(self, user_id: int) -> dict:
        """Get aggregated AI communication stats."""
        seller_id = await self._get_seller_id_from_user(user_id)
        return await self.interaction_repo.get_stats(seller_id)
