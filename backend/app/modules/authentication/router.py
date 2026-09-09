"""Authentication Router — HTTP endpoints only."""
from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user_id
from app.infrastructure.redis.ratelimit import rate_limit
from app.modules.authentication.dependencies import get_auth_service
from app.modules.authentication.schemas import RegisterRequest, LoginRequest, DemoLoginRequest, TokenResponse
from app.modules.authentication.service import AuthService

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit(20, 60, "auth:register"))],
)
async def register(
    data: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
):
    """Register a new seller or buyer account (role picked once, at registration)."""
    return await service.register(data)


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit(30, 60, "auth:login"))],
)
async def login(
    data: LoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    """Login with email/phone and password."""
    return await service.login(data)


@router.post(
    "/demo-login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit(30, 60, "auth:demo"))],
)
async def demo_login(
    data: DemoLoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    """One-click temporary login with a seeded demo account.

    Keys: seller1, seller2, buyer1, buyer2, admin (see seed_demo_users.py).
    """
    return await service.demo_login(data)


@router.post("/logout")
async def logout():
    """Logout — stateless JWT; the client discards the token.

    If server-side revocation is needed later, add a Redis denylist here.
    """
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_me(
    user_id: str = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service),
):
    """Get current user info plus the profile matching their role."""
    uid = int(user_id)
    user = await service.get_current_user(uid)
    role = user.role.value if hasattr(user.role, "value") else user.role

    base = {
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": role,
        } if user else None,
        "seller": None,
        "buyer": None,
    }

    if role == "seller":
        profile = await service.get_seller_profile(uid)
        base["seller"] = {
            "id": str(profile.id),
            "business_name": profile.business_name,
            "business_type": profile.business_type,
            "description": profile.description,
            "phone": profile.phone,
            "email": profile.email,
            "website": profile.website,
            "city": profile.city,
            "country": profile.country,
            "verification_status": profile.verification_status.value if hasattr(profile.verification_status, "value") else profile.verification_status,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
        } if profile else None
    elif role == "buyer":
        profile = await service.get_buyer_profile(uid)
        base["buyer"] = {
            "id": str(profile.id),
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "phone": profile.phone,
            "city": profile.city,
            "country": profile.country,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
        } if profile else None

    return base