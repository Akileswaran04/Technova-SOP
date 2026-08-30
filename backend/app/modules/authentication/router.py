"""Authentication Router — HTTP endpoints only."""
from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user_id
from app.modules.authentication.dependencies import get_auth_service
from app.modules.authentication.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.modules.authentication.service import AuthService

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(
    data: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
):
    """Register a new seller account."""
    return await service.register(data)


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    """Login with email/phone and password."""
    return await service.login(data)


@router.get("/me")
async def get_me(
    user_id: str = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service),
):
    """Get current user info and seller profile."""
    uid = int(user_id)
    user = await service.get_current_user(uid)
    profile = await service.get_seller_profile(uid)

    return {
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
        } if user else None,
        "seller": {
            "id": str(profile.id),
            "business_name": profile.business_name,
            "business_type": profile.business_type,
            "description": profile.description,
            "phone": profile.phone,
            "email": profile.email,
            "website": profile.website,
            "city": profile.city,
            "country": profile.country,
            "verification_status": profile.verification_status.value if hasattr(profile.verification_status, 'value') else profile.verification_status,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
        } if profile else None,
    }
