"""Buyer Discovery Router — HTTP endpoints only."""
from typing import List


from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user_id
from app.modules.buyer_discovery.dependencies import get_customer_service
from app.modules.buyer_discovery.schemas import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
)
from app.modules.buyer_discovery.service import CustomerService

router = APIRouter()


@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    user_id: str = Depends(get_current_user_id),
    service: CustomerService = Depends(get_customer_service),
):
    """List all customers for the current seller."""
    return await service.get_customers_by_seller(int(user_id))


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    data: CustomerCreate,
    user_id: str = Depends(get_current_user_id),
    service: CustomerService = Depends(get_customer_service),
):
    """Create a new customer record."""
    return await service.create_customer(int(user_id), data)


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    service: CustomerService = Depends(get_customer_service),
):
    """Get a customer by ID."""
    return await service.get_customer(customer_id)


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    service: CustomerService = Depends(get_customer_service),
):
    """Update a customer record."""
    return await service.update_customer(customer_id, data)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: int,
    service: CustomerService = Depends(get_customer_service),
):
    """Delete a customer record."""
    await service.delete_customer(customer_id)
