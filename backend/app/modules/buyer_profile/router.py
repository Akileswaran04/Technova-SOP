"""Buyer Profile Router — HTTP endpoints only."""
from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user_id, require_roles
from app.modules.buyer_profile.dependencies import get_buyer_profile_service
from app.modules.buyer_profile.schemas import (
    BuyerProfileUpdate, BuyerProfileResponse,
)
from app.modules.buyer_profile.service import BuyerProfileService

router = APIRouter()


@router.get("/me", response_model=BuyerProfileResponse)
async def get_my_profile(
    user_id: str = Depends(get_current_user_id),
    service: BuyerProfileService = Depends(get_buyer_profile_service),
):
    """Get the current buyer's own profile."""
    return await service.get_own_profile(int(user_id))


@router.put("/me", response_model=BuyerProfileResponse)
async def update_my_profile(
    data: BuyerProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    service: BuyerProfileService = Depends(get_buyer_profile_service),
):
    """Update the current buyer's own profile."""
    return await service.update_own_profile(int(user_id), data)


@router.get("/{buyer_id}", response_model=BuyerProfileResponse)
async def get_buyer(
    buyer_id: int,
    service: BuyerProfileService = Depends(get_buyer_profile_service),
):
    """Get a buyer profile by ID."""
    return await service.get_profile(buyer_id)