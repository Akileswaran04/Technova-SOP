from typing import List


from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user_id
from app.modules.product_listing.dependencies import get_product_service
from app.modules.product_listing.schemas import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    StockUpdate, LikeResponse, ReviewCreate, ReviewResponse, ReviewReply,
)
from app.modules.product_listing.service import ProductService

router = APIRouter()


@router.get("", response_model=ProductListResponse)
async def list_products(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_id),
    service: ProductService = Depends(get_product_service),
):
    return await service.get_products_by_seller(int(user_id), limit=limit, offset=offset)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    user_id: str = Depends(get_current_user_id),
    service: ProductService = Depends(get_product_service),
):
    return await service.create_product(int(user_id), data)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    service: ProductService = Depends(get_product_service),
):
    return await service.get_product(product_id)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    user_id: str = Depends(get_current_user_id),
    service: ProductService = Depends(get_product_service),
):
    return await service.update_product(int(user_id), product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    user_id: str = Depends(get_current_user_id),
    service: ProductService = Depends(get_product_service),
):
    await service.delete_product(int(user_id), product_id)


@router.patch("/{product_id}/stock", response_model=ProductResponse)
async def adjust_stock(
    product_id: int,
    data: StockUpdate,
    user_id: str = Depends(get_current_user_id),
    service: ProductService = Depends(get_product_service),
):
    return await service.adjust_stock(int(user_id), product_id, data.delta)


@router.post("/{product_id}/like", response_model=LikeResponse)
async def toggle_like(
    product_id: int,
    service: ProductService = Depends(get_product_service),
):
    return await service.toggle_like(product_id)


@router.get("/{product_id}/reviews", response_model=List[ReviewResponse])
async def list_reviews(
    product_id: int,
    service: ProductService = Depends(get_product_service),
):
    return await service.get_reviews(product_id)


@router.post("/{product_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def add_review(
    product_id: int,
    data: ReviewCreate,
    user_id: str = Depends(get_current_user_id),
    service: ProductService = Depends(get_product_service),
):
    return await service.add_review(int(user_id), product_id, data)


@router.put("/{product_id}/reviews/{review_id}/reply", response_model=ReviewResponse)
async def reply_to_review(
    product_id: int,
    review_id: int,
    data: ReviewReply,
    user_id: str = Depends(get_current_user_id),
    service: ProductService = Depends(get_product_service),
):
    return await service.reply_to_review(int(user_id), review_id, data)