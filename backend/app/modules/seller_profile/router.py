"""
Seller Profile Router — HTTP endpoints only.
"""

from typing import List

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user_id
from app.modules.seller_profile.dependencies import get_seller_profile_service
from app.modules.seller_profile.schemas import (
    SellerProfileCreate, SellerProfileUpdate, SellerProfileResponse,
    SellerVerificationResponse, StatusUpdateRequest, ProfileSubmitResponse,
)
from app.modules.seller_profile.service import SellerProfileService

router = APIRouter()


@router.get("/profile", response_model=SellerProfileResponse)
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    service: SellerProfileService = Depends(get_seller_profile_service),
):
    """Get current user's seller profile."""
    from uuid import UUID
    profile = await service.get_profile(UUID(user_id))
    return profile


@router.post("/profile", response_model=SellerProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    data: SellerProfileCreate,
    user_id: str = Depends(get_current_user_id),
    service: SellerProfileService = Depends(get_seller_profile_service),
):
    """Create a new seller profile."""
    from uuid import UUID
    profile = await service.create_profile(UUID(user_id), data)
    return profile


@router.put("/profile", response_model=SellerProfileResponse)
async def update_profile(
    data: SellerProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    service: SellerProfileService = Depends(get_seller_profile_service),
):
    """Update seller profile."""
    from uuid import UUID
    profile = await service.update_profile(UUID(user_id), data)
    return profile


@router.post("/profile/submit", response_model=ProfileSubmitResponse)
async def submit_profile(
    user_id: str = Depends(get_current_user_id),
    service: SellerProfileService = Depends(get_seller_profile_service),
):
    """Submit profile for verification review."""
    from uuid import UUID
    profile = await service.submit_for_review(UUID(user_id))
    return ProfileSubmitResponse(profile=profile)


@router.patch("/profile/status", response_model=SellerProfileResponse)
async def update_status(
    data: StatusUpdateRequest,
    profile_id: str = None,
    user_id: str = Depends(get_current_user_id),
    service: SellerProfileService = Depends(get_seller_profile_service),
):
    """Update verification status (admin action)."""
    from uuid import UUID
    target_id = UUID(profile_id) if profile_id else UUID(user_id)
    profile = await service.update_status(target_id, data)
    return profile
