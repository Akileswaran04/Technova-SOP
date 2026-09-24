"""Cart Service — business logic, plus checkout (delegates order creation to
OrderService so stock-decrement/mock-payment/tracking-event logic lives in
exactly one place)."""
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.cart.repository import CartRepository
from app.modules.cart.models import CartItem
from app.modules.cart.schemas import CartItemCreate, CartItemUpdate, CheckoutRequest
from app.modules.buyer_profile.models import BuyerProfile, Address
from app.modules.seller_profile.models import Product
from app.modules.orders.service import OrderService
from app.modules.orders.schemas import OrderCreate, OrderItemCreate
from app.core.exceptions import NotFoundException, ForbiddenException, ValidationException


def _item_response(item: CartItem) -> dict:
    product = item.product
    return {
        "id": item.id,
        "product_id": item.product_id,
        "product_name": product.name if product else "Unknown product",
        "product_image_url": product.image_url if product else None,
        "unit_price": product.price if product else 0.0,
        "seller_id": product.seller_id if product else 0,
        "available_stock": product.stock if product else 0,
        "quantity": item.quantity,
        "line_total": round((product.price if product else 0.0) * item.quantity, 2),
        "added_at": item.added_at,
    }


class CartService:
    """Business logic for the buyer's cart and checkout."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CartRepository(db)

    async def _get_buyer_id(self, user_id: int) -> int:
        result = await self.db.execute(select(BuyerProfile).where(BuyerProfile.user_id == user_id))
        profile = result.scalar_one_or_none()
        if not profile:
            raise ForbiddenException("Only buyers have a cart")
        return profile.id

    def _to_response(self, cart_id: int, items: list[CartItem]) -> dict:
        item_responses = [_item_response(i) for i in items]
        return {
            "id": cart_id,
            "items": item_responses,
            "subtotal": round(sum(i["line_total"] for i in item_responses), 2),
            "item_count": sum(i["quantity"] for i in item_responses),
        }

    async def get_cart(self, user_id: int) -> dict:
        buyer_id = await self._get_buyer_id(user_id)
        cart = await self.repo.get_or_create(buyer_id)
        items = await self.repo.list_items(cart.id)
        return self._to_response(cart.id, items)

    async def add_item(self, user_id: int, data: CartItemCreate) -> dict:
        buyer_id = await self._get_buyer_id(user_id)
        cart = await self.repo.get_or_create(buyer_id)

        product = (await self.db.execute(select(Product).where(Product.id == data.product_id))).scalar_one_or_none()
        if not product:
            raise NotFoundException("Product", str(data.product_id))

        existing = await self.repo.get_item(cart.id, data.product_id)
        next_quantity = (existing.quantity if existing else 0) + data.quantity
        if next_quantity > product.stock:
            raise ValidationException(f"Only {product.stock} of '{product.name}' in stock")

        await self.repo.upsert_item(cart.id, data.product_id, data.quantity)
        items = await self.repo.list_items(cart.id)
        return self._to_response(cart.id, items)

    async def update_item(self, user_id: int, item_id: int, data: CartItemUpdate) -> dict:
        buyer_id = await self._get_buyer_id(user_id)
        cart = await self.repo.get_or_create(buyer_id)
        item = await self.repo.get_item_by_id(cart.id, item_id)
        if not item:
            raise NotFoundException("CartItem", str(item_id))
        if data.quantity > item.product.stock:
            raise ValidationException(f"Only {item.product.stock} of '{item.product.name}' in stock")

        await self.repo.update_quantity(cart.id, item_id, data.quantity)
        items = await self.repo.list_items(cart.id)
        return self._to_response(cart.id, items)

    async def remove_item(self, user_id: int, item_id: int) -> dict:
        buyer_id = await self._get_buyer_id(user_id)
        cart = await self.repo.get_or_create(buyer_id)
        await self.repo.remove_item(cart.id, item_id)
        items = await self.repo.list_items(cart.id)
        return self._to_response(cart.id, items)

    async def clear_cart(self, user_id: int) -> dict:
        buyer_id = await self._get_buyer_id(user_id)
        cart = await self.repo.get_or_create(buyer_id)
        await self.repo.clear(cart.id)
        return self._to_response(cart.id, [])

    async def checkout(self, user_id: int, data: CheckoutRequest) -> list[dict]:
        """Split the cart into one order per seller (existing Order model is
        single-seller) and clear the cart on success."""
        buyer_id = await self._get_buyer_id(user_id)
        cart = await self.repo.get_or_create(buyer_id)
        items = await self.repo.list_items(cart.id)
        if not items:
            raise ValidationException("Cart is empty")

        address = (await self.db.execute(
            select(Address).where(Address.id == data.address_id, Address.buyer_id == buyer_id)
        )).scalar_one_or_none()
        if not address:
            raise NotFoundException("Address", str(data.address_id))
        shipping_address = ", ".join(
            part for part in [address.line1, address.line2, address.city, address.state, address.postal_code, address.country] if part
        )

        by_seller: dict[int, list[CartItem]] = defaultdict(list)
        for item in items:
            by_seller[item.product.seller_id].append(item)

        order_service = OrderService(self.db)
        created_orders = []
        for seller_items in by_seller.values():
            order_create = OrderCreate(
                items=[OrderItemCreate(product_id=i.product_id, quantity=i.quantity) for i in seller_items],
                shipping_address=shipping_address,
                notes=data.notes,
                payment_method=data.payment_method or "mock",
            )
            created_orders.append(await order_service.create_order(user_id, order_create))

        await self.repo.clear(cart.id)
        return created_orders
