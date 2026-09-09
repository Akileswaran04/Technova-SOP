"""Orders Router — HTTP endpoints only."""
from typing import Optional


from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user
from app.modules.orders.dependencies import get_order_service
from app.modules.orders.schemas import (
    OrderCreate, OrderResponse, OrderStatusUpdate, OrderReviewCreate,
)
from app.modules.orders.service import OrderService

router = APIRouter()


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    user=Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    """Place an order (ACID: stock decrement + mock payment + transaction)."""
    return await service.create_order(user.id, data)


@router.get("")
async def list_orders(
    cursor: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    user=Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    """List orders for the current buyer or seller (cursor-paginated)."""
    return await service.list_orders(user.id, user.role, cursor=cursor, limit=limit)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    user=Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    """Get an order (participant only)."""
    return await service.get_order(user.id, user.role, order_id)


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    user=Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    """Seller updates order status (state machine, never free-text)."""
    return await service.update_status(user.id, order_id, data)


@router.post("/{order_id}/review")
async def add_order_review(
    order_id: int,
    data: OrderReviewCreate,
    user=Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    """Buyer leaves a review after an order — feeds trust_scores."""
    return await service.add_review(user.id, order_id, data)