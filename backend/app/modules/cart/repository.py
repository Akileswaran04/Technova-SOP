"""Cart Repository — database operations only."""
from typing import Optional

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.modules.cart.models import Cart, CartItem


class CartRepository:
    """Repository for carts/cart_items."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create(self, buyer_id: int) -> Cart:
        result = await self.db.execute(select(Cart).where(Cart.buyer_id == buyer_id))
        cart = result.scalar_one_or_none()
        if cart:
            return cart
        cart = Cart(buyer_id=buyer_id)
        self.db.add(cart)
        await self.db.flush()
        await self.db.refresh(cart)
        return cart

    async def list_items(self, cart_id: int) -> list[CartItem]:
        result = await self.db.execute(
            select(CartItem)
            .where(CartItem.cart_id == cart_id)
            .options(joinedload(CartItem.product))
            .order_by(CartItem.id.asc())
        )
        return list(result.scalars().all())

    async def get_item(self, cart_id: int, product_id: int) -> Optional[CartItem]:
        result = await self.db.execute(
            select(CartItem).where(CartItem.cart_id == cart_id, CartItem.product_id == product_id)
        )
        return result.scalar_one_or_none()

    async def get_item_by_id(self, cart_id: int, item_id: int) -> Optional[CartItem]:
        result = await self.db.execute(
            select(CartItem)
            .where(CartItem.id == item_id, CartItem.cart_id == cart_id)
            .options(joinedload(CartItem.product))
        )
        return result.scalar_one_or_none()

    async def upsert_item(self, cart_id: int, product_id: int, quantity: int) -> CartItem:
        existing = await self.get_item(cart_id, product_id)
        if existing:
            existing.quantity += quantity
            await self.db.flush()
            return await self.get_item_by_id(cart_id, existing.id)
        item = CartItem(cart_id=cart_id, product_id=product_id, quantity=quantity)
        self.db.add(item)
        await self.db.flush()
        return await self.get_item_by_id(cart_id, item.id)

    async def update_quantity(self, cart_id: int, item_id: int, quantity: int) -> Optional[CartItem]:
        await self.db.execute(
            update(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart_id).values(quantity=quantity)
        )
        await self.db.flush()
        return await self.get_item_by_id(cart_id, item_id)

    async def remove_item(self, cart_id: int, item_id: int) -> None:
        await self.db.execute(delete(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart_id))
        await self.db.flush()

    async def clear(self, cart_id: int) -> None:
        await self.db.execute(delete(CartItem).where(CartItem.cart_id == cart_id))
        await self.db.flush()
