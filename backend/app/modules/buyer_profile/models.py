"""
Buyer Profile SQLAlchemy model.

Matches the `buyer_profiles` table created in alembic migration 001_initial_schema.
"""
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.infrastructure.postgres.base import Base


class BuyerProfile(Base):
    """Buyer identity and preferences — separate from identity (users)."""
    __tablename__ = "buyer_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Identity
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)

    # Location / preferences
    default_address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    preferred_payment_method = Column(String(50), nullable=True)
    is_business_buyer = Column(Boolean, nullable=False, default=False)
    company_name = Column(String(255), nullable=True)
    tax_id = Column(String(100), nullable=True)

    # Timestamps
    created_at = Column(DateTime(), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(), nullable=False, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="buyer_profile")