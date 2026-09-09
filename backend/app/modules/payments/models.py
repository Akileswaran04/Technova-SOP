"""
Payment models — payments and transactions (PostgreSQL source of truth, mock ledger).

`transactions` matches migration 001. `payments` is added by migration 003.
"""
from datetime import datetime

from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from app.infrastructure.postgres.base import Base


def _pg_enum(name, values):
    return PG_ENUM(*values, name=name, create_type=False)


transactionstatus_enum = _pg_enum("transactionstatus", ["pending", "completed", "failed", "refunded"])


class Payment(Base):
    """Payment attempt against an order — mock ledger provider for now."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    provider = Column(String(50), nullable=False, default="mock")
    status = Column(String(20), nullable=False, default="pending")  # pending | completed | failed | refunded
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    reference = Column(String(100), nullable=True)
    failure_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(), nullable=False, default=datetime.utcnow)

    # Relationships
    order = relationship("Order", foreign_keys=[order_id])


class Transaction(Base):
    """Financial transaction record tied to an order."""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    status = Column(transactionstatus_enum, nullable=False, default="pending")
    payment_method = Column(String(50), nullable=True)
    transaction_id = Column(String(100), nullable=True, unique=True)
    failure_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(), nullable=False, default=datetime.utcnow)