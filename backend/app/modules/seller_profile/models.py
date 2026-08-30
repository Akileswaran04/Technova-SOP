"""
SQLAlchemy models for seller_profile module.

Tables:
- users: Identity (authentication, roles)
- seller_profiles: Business information
- seller_verifications: Verification documents and status
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum,
    func, CheckConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.infrastructure.postgres.base import Base
from app.shared.enums import SellerProfileStatus, UserRole, VerificationType


class User(Base):
    """User identity — authentication and roles."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(254), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole, name="user_role"), nullable=False, default=UserRole.SELLER)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    seller_profile = relationship("SellerProfile", back_populates="user", uselist=False)


class SellerProfile(Base):
    """Seller business profile — separate from identity."""
    __tablename__ = "seller_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Business information
    business_name = Column(String(200), nullable=False)
    business_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)

    # Contact
    phone = Column(String(20), nullable=True)
    email = Column(String(254), nullable=True)
    website = Column(String(2000), nullable=True)

    # Address
    address_line_1 = Column(String(500), nullable=True)
    address_line_2 = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True, default="India")
    postal_code = Column(String(20), nullable=True)

    # Verification
    license_number = Column(String(100), nullable=True)
    verification_status = Column(
        SAEnum(SellerProfileStatus, name="seller_profile_status"),
        nullable=False,
        default=SellerProfileStatus.DRAFT,
    )

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="seller_profile")
    verifications = relationship("SellerVerification", back_populates="seller", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_seller_profiles_status", "verification_status"),
    )


class SellerVerification(Base):
    """Verification documents and review history."""
    __tablename__ = "seller_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("seller_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    verification_type = Column(String(50), nullable=False)
    document_reference = Column(String(500), nullable=True)  # URL or base64 reference
    status = Column(String(50), nullable=False, default="pending")
    reviewed_by = Column(String(254), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    seller = relationship("SellerProfile", back_populates="verifications")
