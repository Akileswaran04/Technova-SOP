"""Buyer Discovery module dependencies."""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.modules.buyer_discovery.discovery_service import DiscoveryService
from app.modules.buyer_discovery.service import CustomerService


async def get_customer_service(
    db: AsyncSession = Depends(get_db),
) -> CustomerService:
    """Provide CustomerService with database session."""
    return CustomerService(db)


async def get_discovery_service(
    db: AsyncSession = Depends(get_db),
) -> DiscoveryService:
    """Provide DiscoveryService with database session."""
    return DiscoveryService(db)