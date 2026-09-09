"""Product Listing Service — business logic layer."""


from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.product_listing.repository import ProductRepository
from app.modules.seller_profile.models import SellerProfile
from app.modules.buyer_profile.models import BuyerProfile
from app.modules.orders.models import Review, OrderItem, Order
from app.modules.product_listing.schemas import (
    ProductCreate, ProductUpdate, ReviewCreate, ReviewReply,
)
from app.core.exceptions import NotFoundException, ValidationException, ForbiddenException


class ProductService:
    """Business logic for product management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.product_repo = ProductRepository(db)

    async def _get_seller_id_from_user(self, user_id: int) -> int:
        """Resolve seller_profile ID from user ID."""
        result = await self.db.execute(
            select(SellerProfile).where(SellerProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundException("SellerProfile", str(user_id))
        return profile.id

    async def _get_product_or_404(self, product_id: int):
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product", str(product_id))
        return product

    async def _assert_owns_product(self, user_id: int, product) -> None:
        """RBAC — only the owning seller may mutate a product."""
        seller_id = await self._get_seller_id_from_user(user_id)
        if product.seller_id != seller_id:
            raise ForbiddenException("You do not own this product")

    async def create_product(self, user_id: int, data: ProductCreate) -> dict:
        seller_id = await self._get_seller_id_from_user(user_id)
        product = await self.product_repo.create(
            seller_id=seller_id,
            data=data.model_dump(exclude_unset=True),
        )
        return product

    async def get_product(self, product_id: int) -> dict:
        return await self._get_product_or_404(product_id)

    async def get_products_by_seller(self, user_id: int) -> list:
        seller_id = await self._get_seller_id_from_user(user_id)
        return await self.product_repo.get_by_seller(seller_id)

    async def get_public_seller_products(self, seller_id: int, limit: int = 100, offset: int = 0) -> list:
        """Public product list for a seller (used by buyer discovery)."""
        result = await self.db.execute(
            select(Product)
            .where(Product.seller_id == seller_id)
            .order_by(Product.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def update_product(self, user_id: int, product_id: int, data: ProductUpdate) -> dict:
        product = await self._get_product_or_404(product_id)
        await self._assert_owns_product(user_id, product)

        update_data = data.model_dump(exclude_unset=True)
        if "likes" in update_data:
            update_data.pop("likes")  # likes only via toggle_like
        updated = await self.product_repo.update(product_id, update_data)
        return updated

    async def delete_product(self, user_id: int, product_id: int) -> bool:
        product = await self._get_product_or_404(product_id)
        await self._assert_owns_product(user_id, product)
        return await self.product_repo.delete(product_id)

    async def adjust_stock(self, user_id: int, product_id: int, delta: int) -> dict:
        product = await self._get_product_or_404(product_id)
        await self._assert_owns_product(user_id, product)

        new_stock = product.stock + delta
        if new_stock < 0:
            raise ValidationException("Stock cannot go below zero")

        updated = await self.product_repo.update(product_id, {"stock": new_stock})
        return updated

    async def toggle_like(self, product_id: int) -> dict:
        product = await self._get_product_or_404(product_id)
        new_likes = product.likes + 1
        await self.product_repo.update(product_id, {"likes": new_likes})
        return {"likes": new_likes, "liked": True}

    # ── Reviews ──

    async def add_review(self, user_id: int, product_id: int, data: ReviewCreate) -> dict:
        """Leave a review on a product (buyer role)."""
        product = await self._get_product_or_404(product_id)

        buyer_result = await self.db.execute(
            select(BuyerProfile).where(BuyerProfile.user_id == user_id)
        )
        buyer = buyer_result.scalar_one_or_none()
        if not buyer:
            raise ForbiddenException("Only buyers can leave reviews")

        # Verified purchase: does this buyer have an order containing this product?
        order_item_result = await self.db.execute(
            select(OrderItem.id)
            .join(OrderItem.order)
            .where(OrderItem.product_id == product_id, Order.buyer_id == buyer.id)
            .limit(1)
        )
        verified = order_item_result.scalar_one_or_none() is not None

        review = Review(
            product_id=product_id,
            buyer_id=buyer.id,
            seller_id=product.seller_id,
            rating=data.rating,
            comment=data.comment,
            is_verified_purchase=verified,
        )
        self.db.add(review)
        await self.db.flush()
        await self.db.refresh(review)
        return review

    async def get_reviews(self, product_id: int) -> list:
        result = await self.db.execute(
            select(Review)
            .where(Review.product_id == product_id)
            .order_by(Review.created_at.desc())
        )
        return list(result.scalars().all())

    async def reply_to_review(self, user_id: int, review_id: int, data: ReviewReply) -> dict:
        result = await self.db.execute(
            select(Review).where(Review.id == review_id)
        )
        review = result.scalar_one_or_none()
        if not review:
            raise NotFoundException("Review", str(review_id))

        product = await self._get_product_or_404(review.product_id)
        await self._assert_owns_product(user_id, product)

        review.seller_reply = data.seller_reply
        await self.db.flush()
        await self.db.refresh(review)
        return review