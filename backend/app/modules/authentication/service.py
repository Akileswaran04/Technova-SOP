"""Authentication Service — register, login, token management.

Single identity, single login: role is chosen once at registration and
carried in the JWT. Sellers get a SellerProfile, buyers a BuyerProfile.
"""
from typing import Optional


from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.seller_profile.models import User, SellerProfile
from app.modules.buyer_profile.models import BuyerProfile
from app.modules.authentication.schemas import RegisterRequest, LoginRequest, DemoLoginRequest
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import ConflictException, ValidationException, NotFoundException

# Seeded by backend/seed_demo_users.py — same keys as the demo buttons.
DEMO_ACCOUNT_EMAILS = {
    "seller1": "seller1@technova.local",
    "seller2": "seller2@technova.local",
    "buyer1": "buyer1@technova.local",
    "buyer2": "buyer2@technova.local",
    "admin": "admin@technova.local",
}


class AuthService:
    """Business logic for authentication."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> dict:
        """Register a new seller or buyer account."""
        # Check if email already exists
        existing = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        if existing.scalar_one_or_none():
            raise ConflictException("An account with this email already exists")

        # Create user with role from registration
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role=data.role,
            is_active=True,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)

        seller_id = None
        buyer_id = None

        if data.role == "seller":
            profile = SellerProfile(
                user_id=user.id,
                business_name=data.business_name or data.full_name or "",
                business_type=data.business_type or "other",
                license_number=data.license_number,
                verification_status="draft",
            )
            self.db.add(profile)
            await self.db.flush()
            await self.db.refresh(profile)
            seller_id = str(profile.id)
        else:
            profile = BuyerProfile(
                user_id=user.id,
                first_name=data.first_name or (data.full_name or "Buyer").split()[0],
                last_name=data.last_name or (data.full_name or "Buyer").split()[-1] if (data.full_name or "Buyer").split() else "User",
                phone=data.phone,
                city=data.city,
                country=data.country or "India",
            )
            self.db.add(profile)
            await self.db.flush()
            await self.db.refresh(profile)
            buyer_id = str(profile.id)

        # Generate token with role claim
        token = create_access_token(data={"sub": str(user.id), "role": user.role})

        return {
            "access_token": token,
            "token_type": "bearer",
            "role": user.role,
            "seller_id": seller_id,
            "buyer_id": buyer_id,
            "email": user.email,
            "full_name": user.full_name,
        }

    async def demo_login(self, data: DemoLoginRequest) -> dict:
        """One-click login for a seeded demo account (temporary login).

        Demo-only convenience for the local build: the key maps to a fixed
        demo email, and only accounts seeded by seed_demo_users.py qualify.
        """
        email = DEMO_ACCOUNT_EMAILS.get(data.demo)
        if not email:
            raise ValidationException("Unknown demo account")
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise NotFoundException("User", email)
        return await self._token_response(user)

    async def login(self, data: LoginRequest) -> dict:
        """Login with email/phone and password."""
        # Find user by email or phone
        result = await self.db.execute(
            select(User).where(
                (User.email == data.identifier) | (User.phone == data.identifier)
            )
        )
        user = result.scalar_one_or_none()

        if not user:
            raise NotFoundException("User", data.identifier)

        if not verify_password(data.password, user.password_hash):
            raise ValidationException("Incorrect password")

        # Resolve profile by role
        seller_id = None
        buyer_id = None
        if user.role == "seller":
            profile_result = await self.db.execute(
                select(SellerProfile).where(SellerProfile.user_id == user.id)
            )
            profile = profile_result.scalar_one_or_none()
            seller_id = str(profile.id) if profile else None
        elif user.role == "buyer":
            profile_result = await self.db.execute(
                select(BuyerProfile).where(BuyerProfile.user_id == user.id)
            )
            profile = profile_result.scalar_one_or_none()
            buyer_id = str(profile.id) if profile else None

        return await self._token_response(user, seller_id=seller_id, buyer_id=buyer_id)

    async def _token_response(self, user, seller_id=None, buyer_id=None) -> dict:
        """Build the standard token response for a user."""
        if user.role == "seller" and seller_id is None:
            profile_result = await self.db.execute(
                select(SellerProfile).where(SellerProfile.user_id == user.id)
            )
            profile = profile_result.scalar_one_or_none()
            seller_id = str(profile.id) if profile else None
        elif user.role == "buyer" and buyer_id is None:
            profile_result = await self.db.execute(
                select(BuyerProfile).where(BuyerProfile.user_id == user.id)
            )
            profile = profile_result.scalar_one_or_none()
            buyer_id = str(profile.id) if profile else None

        # Generate token with role claim
        token = create_access_token(data={"sub": str(user.id), "role": user.role})

        return {
            "access_token": token,
            "token_type": "bearer",
            "role": user.role,
            "seller_id": seller_id,
            "buyer_id": buyer_id,
            "email": user.email,
            "full_name": user.full_name,
        }

    async def get_current_user(self, user_id) -> Optional[User]:
        """Get current user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_seller_profile(self, user_id) -> Optional[SellerProfile]:
        """Get seller profile for current user."""
        result = await self.db.execute(
            select(SellerProfile).where(SellerProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_buyer_profile(self, user_id) -> Optional[BuyerProfile]:
        """Get buyer profile for current user."""
        result = await self.db.execute(
            select(BuyerProfile).where(BuyerProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()