from datetime import datetime
from typing import Optional, List


from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=255)
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    customer_name: str
    rating: int
    comment: Optional[str]
    seller_reply: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewReply(BaseModel):
    seller_reply: str = Field(..., min_length=1)


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field("general", min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    image_url: Optional[str] = None
    stock: int = Field(0, ge=0)
    low_stock_threshold: int = Field(5, ge=0)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    image_url: Optional[str] = None
    stock: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    likes: Optional[int] = Field(None, ge=0)


class ProductResponse(BaseModel):
    id: int
    seller_id: int
    name: str
    description: Optional[str]
    category: str
    price: float
    image_url: Optional[str]
    stock: int
    low_stock_threshold: int
    likes: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    has_more: bool
    limit: int
    offset: int


class StockUpdate(BaseModel):
    delta: int = Field(..., description="Amount to add (positive) or subtract (negative)")


class LikeResponse(BaseModel):
    likes: int
    liked: bool
