"""Recommendation Router — HTTP endpoints only."""
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.modules.recommendation.dependencies import get_recommendation_service
from app.modules.recommendation.schemas import RecommendationResponse, CompareRequest, CompareResponse
from app.modules.recommendation.service import RecommendationService

router = APIRouter()


@router.get("", response_model=RecommendationResponse)
async def recommend(
    category: Optional[str] = Query(None),
    budget: Optional[float] = Query(None, gt=0),
    q: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    service: RecommendationService = Depends(get_recommendation_service),
):
    """2-3 relevant, reasoned product recommendations — never a full list."""
    items = await service.recommend(category=category, budget=budget, q=q, location=location)
    return {"items": items}


@router.post("/compare", response_model=CompareResponse)
async def compare(
    data: CompareRequest,
    service: RecommendationService = Depends(get_recommendation_service),
):
    """Smart comparison of 2-3 buyer-selected products."""
    return await service.compare(data)
