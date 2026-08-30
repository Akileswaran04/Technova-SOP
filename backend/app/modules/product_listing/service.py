"""Product Listing Service — business logic layer."""


from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.product_listing.repository import ProductRepository
from app.modules.seller_profile.models import SellerProfile
from app.modules.product_listing.schemas import (
    ProductCreate, ProductUpdate, StockUpdate, ReviewCreate, ReviewReply,
)
from app.core.exceptions import NotFoundException, ValidationException


class ProductService:
    """Business logic for product management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.product_repo = ProductRepository(db)

    async def _get_seller_id_from_user(self, user_id: int) -> int:
        """Resolve seller_profile UUID from user UUID."""
        result = await self.db.execute(
            select(SellerProfile).where(SellerProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundException("SellerProfile", str(user_id))
        return profile.id

    async def create_product(self, user_id: int, data: ProductCreate) -> dict:
        seller_id = await self._get_seller_id_from_user(user_id)
        product = await self.product_repo.create(
            seller_id=seller_id,
            data=data.model_dump(exclude_unset=True),
        )
        return product

    async def get_product(self, product_id: int) -> dict:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product", str(product_id))
        return product

    async def get_products_by_seller(self, user_id: int) -> list:
        seller_id = await self._get_seller_id_from_user(user_id)
        return await self.product_repo.get_by_seller(seller_id)

    async def update_product(self, product_id: int, data: ProductUpdate) -> dict:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product", str(product_id))

        update_data = data.model_dump(exclude_unset=True)
        updated = await self.product_repo.update(product_id, update_data)
        return updated

    async def delete_product(self, product_id: int) -> bool:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product", str(product_id))
        return await self.product_repo.delete(product_id)

    async def adjust_stock(self, product_id: int, delta: int) -> dict:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product", str(product_id))

        new_stock = product.stock + delta
        if new_stock < 0:
            raise ValidationException("Stock cannot go below zero")

        updated = await self.product_repo.update(product_id, {"stock": new_stock})
        return updated

    async def toggle_like(self, product_id: int) -> dict:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product", str(product_id))

        new_likes = product.likes + 1
        updated = await self.product_repo.update(product_id, {"likes": new_likes})
        return {"likes": updated.likes, "liked": True}

    async def add_review(self, product_id: int, data: ReviewCreate) -> dict:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product", str(product_id))
        return {"id": 0, "product_id": product_id, "customer_name": data.customer_name, "rating": data.rating, "comment": data.comment, "seller_reply": None, "created_at": ""}

    async def reply_to_review(self, review_id: int, data: ReviewReply) -> dict:
        return {"id": review_id, "seller_reply": data.seller_reply}

    async def get_reviews(self, product_id: int) -> list:
        return []
