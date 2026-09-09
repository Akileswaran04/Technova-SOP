"""Orders Service — business logic, ACID in PostgreSQL.

Create order → decrement stock → payment (mock) → transaction, all within one
DB transaction. Cross-store sync happens in background workers, never in a
fragile cross-DB transaction.
"""
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.orders.repository import OrderRepository
from app.modules.orders.models import Order, OrderItem, Review
from app.modules.seller_profile.models import SellerProfile, Product
from app.modules.buyer_profile.models import BuyerProfile
from app.modules.payments.models import Payment, Transaction
from app.modules.orders.schemas import (
    OrderCreate, OrderItemCreate, OrderStatusUpdate, OrderReviewCreate,
)
from app.core.exceptions import NotFoundException, ForbiddenException, ValidationException


def _serialize_order(order: Order) -> dict:
    return {
        "id": order.id,
        "order_number": order.order_number,
        "buyer_id": order.buyer_id,
        "seller_id": order.seller_id,
        "status": order.status.value if hasattr(order.status, "value") else order.status,
        "total_amount": order.total_amount,
        "currency": order.currency,
        "payment_method": order.payment_method,
        "shipping_address": order.shipping_address,
        "notes": order.notes,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.total_price,
            }
            for item in order.items
        ],
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


class OrderService:
    """Business logic for orders."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = OrderRepository(db)

    async def _get_buyer_id_from_user(self, user_id: int) -> int:
        result = await self.db.execute(
            select(BuyerProfile).where(BuyerProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise ForbiddenException("Only buyers can place orders")
        return profile.id

    async def _get_seller_id_from_user(self, user_id: int) -> int:
        result = await self.db.execute(
            select(SellerProfile).where(SellerProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundException("SellerProfile", str(user_id))
        return profile.id

    async def create_order(self, user_id: int, data: OrderCreate) -> dict:
        """Create order + items + mock payment + transaction atomically."""
        buyer_id = await self._get_buyer_id_from_user(user_id)

        # Lock products to prevent concurrent overselling
        product_ids = [item.product_id for item in data.items]
        result = await self.db.execute(
            select(Product)
            .where(Product.id.in_(product_ids))
            .with_for_update()
        )
        products = {p.id: p for p in result.scalars().all()}
        if len(products) != len(product_ids):
            missing = set(product_ids) - set(products)
            raise NotFoundException("Product", str(sorted(missing)[0]))

        # Single-seller orders: all items must belong to the same seller
        seller_ids = {products[pid].seller_id for pid in product_ids}
        if len(seller_ids) != 1:
            raise ValidationException("All order items must come from one seller")
        seller_id = seller_ids.pop()

        # Validate stock and compute totals
        items = []
        total = 0.0
        for item in data.items:
            product = products[item.product_id]
            if product.stock < item.quantity:
                raise ValidationException(f"'{product.name}' only has {product.stock} in stock")
            unit_price = product.price
            line_total = unit_price * item.quantity
            total += line_total
            items.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "total_price": line_total,
            })

        # Decrement stock
        for item in data.items:
            product = products[item.product_id]
            product.stock -= item.quantity

        order = await self.repo.create({
            "order_number": f"ORD-{uuid.uuid4().hex[:10].upper()}",
            "buyer_id": buyer_id,
            "seller_id": seller_id,
            "status": "pending",
            "total_amount": round(total, 2),
            "currency": "USD",
            "payment_method": data.payment_method or "mock",
            "shipping_address": data.shipping_address,
            "notes": data.notes,
        })
        await self.repo.add_items(order.id, items)

        # Mock payment + transaction — internal ledger, no external provider
        payment = Payment(
            order_id=order.id,
            provider="mock",
            status="completed",
            amount=round(total, 2),
            reference=f"PAY-{uuid.uuid4().hex[:10].upper()}",
        )
        self.db.add(payment)
        transaction = Transaction(
            order_id=order.id,
            amount=round(total, 2),
            status="completed",
            payment_method=data.payment_method or "mock",
            transaction_id=f"TXN-{uuid.uuid4().hex[:10].upper()}",
        )
        self.db.add(transaction)
        await self.db.flush()

        # Re-fetch with eager-loaded items before serializing (no lazy IO)
        order = await self.repo.get_by_id(order.id)
        return _serialize_order(order)

    async def get_order(self, user_id: int, user_role: str, order_id: int) -> dict:
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order", str(order_id))
        await self._assert_access(user_id, user_role, order)
        return _serialize_order(order)

    async def list_orders(
        self, user_id: int, user_role: str, cursor: Optional[str] = None, limit: int = 50
    ) -> dict:
        if user_role == "buyer":
            participant_id = await self._get_buyer_id_from_user(user_id)
            orders, next_cursor = await self.repo.list_by_buyer(participant_id, cursor=int(cursor) if cursor else None, limit=limit)
        elif user_role == "seller":
            participant_id = await self._get_seller_id_from_user(user_id)
            orders, next_cursor = await self.repo.list_by_seller(participant_id, cursor=int(cursor) if cursor else None, limit=limit)
        else:
            raise ForbiddenException("Only sellers and buyers can view orders")
        return {
            "items": [_serialize_order(o) for o in orders],
            "next_cursor": next_cursor,
            "limit": limit,
        }

    async def _assert_access(self, user_id: int, user_role: str, order: Order) -> None:
        if user_role == "buyer":
            buyer_id = await self._get_buyer_id_from_user(user_id)
            if order.buyer_id != buyer_id:
                raise ForbiddenException("Not your order")
        elif user_role == "seller":
            seller_id = await self._get_seller_id_from_user(user_id)
            if order.seller_id != seller_id:
                raise ForbiddenException("Not your order")
        else:
            raise ForbiddenException("Only sellers and buyers can view orders")

    async def update_status(self, user_id: int, order_id: int, data: OrderStatusUpdate) -> dict:
        """Seller updates order status."""
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order", str(order_id))
        seller_id = await self._get_seller_id_from_user(user_id)
        if order.seller_id != seller_id:
            raise ForbiddenException("Not your order")
        updated = await self.repo.update_status(order_id, data.status)
        return _serialize_order(updated)

    async def add_review(self, user_id: int, order_id: int, data: OrderReviewCreate) -> dict:
        """Buyer leaves a review after an order (feeds trust_scores)."""
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order", str(order_id))
        buyer_id = await self._get_buyer_id_from_user(user_id)
        if order.buyer_id != buyer_id:
            raise ForbiddenException("Not your order")

        # One review per order
        existing = await self.db.execute(
            select(Review).where(Review.order_id == order_id)
        )
        if existing.scalar_one_or_none():
            raise ValidationException("Order already reviewed")

        # Review the first product in the order
        first_item = order.items[0] if order.items else None
        review = Review(
            product_id=first_item.product_id if first_item else None,
            buyer_id=buyer_id,
            seller_id=order.seller_id,
            order_id=order_id,
            rating=data.rating,
            title=data.title,
            comment=data.comment,
            is_verified_purchase=True,
        )
        self.db.add(review)
        await self.db.flush()
        await self.db.refresh(review)
        return {
            "id": review.id,
            "order_id": review.order_id,
            "rating": review.rating,
            "title": review.title,
            "comment": review.comment,
            "is_verified_purchase": review.is_verified_purchase,
        }