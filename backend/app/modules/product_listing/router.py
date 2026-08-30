"""Product Listing Router — HTTP endpoints only."""
from typing import List


from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user_id
from app.modules.product_listing.dependencies import get_product_service
from app.modules.product_listing.schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    StockUpdate, LikeResponse, ReviewCreate, ReviewResponse, ReviewReply,
)
from app.modules.product_listing.service import ProductService

router = APIRouter()


# ── Products ──

@router.get("", response_model=List[ProductResponse])
async def list_products(
    user_id: str = Depends(get_current_user_id),
    service: ProductService = Depends(get_product_service),
):
    """List all products for the current seller."""
    return await service.get_products_by_seller(int(user_id))


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    user_id: str = Depends(get_current_user_id),
    service: ProductService = Depends(get_product_service),
):
    """Create a new product."""
    return await service.create_product(int(user_id), data)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    service: ProductService = Depends(get_product_service),
):
    """Get a product by ID."""
    return await service.get_product(product_id)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    service: ProductService = Depends(get_product_service),
):
    """Update a product."""
    return await service.update_product(product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    service: ProductService = Depends(get_product_service),
):
    """Delete a product."""
    await service.delete_product(product_id)


@router.patch("/{product_id}/stock", response_model=ProductResponse)
async def adjust_stock(
    product_id: int,
    data: StockUpdate,
    service: ProductService = Depends(get_product_service),
):
    """Adjust product stock by delta amount."""
    return await service.adjust_stock(product_id, data.delta)


@router.post("/{product_id}/like", response_model=LikeResponse)
async def toggle_like(
    product_id: int,
    service: ProductService = Depends(get_product_service),
):
    """Like a product."""
    return await service.toggle_like(product_id)


# ── Reviews ──

@router.get("/{product_id}/reviews", response_model=List[ReviewResponse])
async def list_reviews(
    product_id: int,
    service: ProductService = Depends(get_product_service),
):
    """List reviews for a product."""
    return await service.get_reviews(product_id)


@router.post("/{product_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def add_review(
    product_id: int,
    data: ReviewCreate,
    service: ProductService = Depends(get_product_service),
):
    """Add a review to a product."""
    return await service.add_review(product_id, data)


@router.put("/reviews/{review_id}/reply", response_model=ReviewResponse)
async def reply_to_review(
    review_id: int,
    data: ReviewReply,
    service: ProductService = Depends(get_product_service),
):
    """Seller reply to a review."""
    return await service.reply_to_review(review_id, data)
