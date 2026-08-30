"""Authentication Service — register, login, token management."""
from typing import Optional


from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.seller_profile.models import User, SellerProfile
from app.modules.authentication.schemas import RegisterRequest, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import ConflictException, ValidationException, NotFoundException


class AuthService:
    """Business logic for authentication."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> dict:
        """Register a new seller account."""
        # Check if email already exists
        existing = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        if existing.scalar_one_or_none():
            raise ConflictException("An account with this email already exists")

        # Create user
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role="seller",
            is_active=True,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)

        # Create empty seller profile
        profile = SellerProfile(
            user_id=user.id,
            business_name=data.full_name or "",
            business_type="other",
        )
        self.db.add(profile)
        await self.db.flush()
        await self.db.refresh(profile)

        # Generate token
        token = create_access_token(data={"sub": str(user.id)})

        return {
            "access_token": token,
            "token_type": "bearer",
            "seller_id": str(profile.id),
            "email": user.email,
            "full_name": user.full_name,
        }

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

        # Get seller profile
        profile_result = await self.db.execute(
            select(SellerProfile).where(SellerProfile.user_id == user.id)
        )
        profile = profile_result.scalar_one_or_none()

        # Generate token
        token = create_access_token(data={"sub": str(user.id)})

        return {
            "access_token": token,
            "token_type": "bearer",
            "seller_id": str(profile.id) if profile else str(user.id),
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
