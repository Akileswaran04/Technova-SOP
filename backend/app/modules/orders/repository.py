"""Orders Repository — database operations only."""
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.orders.models import Order, OrderItem


class OrderRepository:
    """Repository for orders/order_items."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Order:
        order = Order(**data)
        self.db.add(order)
        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def add_items(self, order_id: int, items: list[dict]) -> list[OrderItem]:
        rows = [OrderItem(order_id=order_id, **item) for item in items]
        self.db.add_all(rows)
        await self.db.flush()
        return rows

    async def get_by_id(self, order_id: int) -> Optional[Order]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def list_by_buyer(
        self, buyer_id: int, cursor: Optional[int] = None, limit: int = 50
    ) -> tuple[list[Order], Optional[str]]:
        query = select(Order).options(selectinload(Order.items)).where(Order.buyer_id == buyer_id)
        if cursor:
            query = query.where(Order.id < cursor)
        query = query.order_by(Order.id.desc()).limit(limit + 1)
        result = await self.db.execute(query)
        orders = list(result.scalars().all())
        has_more = len(orders) > limit
        orders = orders[:limit]
        next_cursor = str(orders[-1].id) if has_more and orders else None
        return orders, next_cursor

    async def list_by_seller(
        self, seller_id: int, cursor: Optional[int] = None, limit: int = 50
    ) -> tuple[list[Order], Optional[str]]:
        query = select(Order).options(selectinload(Order.items)).where(Order.seller_id == seller_id)
        if cursor:
            query = query.where(Order.id < cursor)
        query = query.order_by(Order.id.desc()).limit(limit + 1)
        result = await self.db.execute(query)
        orders = list(result.scalars().all())
        has_more = len(orders) > limit
        orders = orders[:limit]
        next_cursor = str(orders[-1].id) if has_more and orders else None
        return orders, next_cursor

    async def update_status(self, order_id: int, status: str) -> Optional[Order]:
        await self.db.execute(
            update(Order).where(Order.id == order_id).values(status=status)
        )
        await self.db.flush()
        return await self.get_by_id(order_id)