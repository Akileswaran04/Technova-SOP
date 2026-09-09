"""Analytics Router — HTTP endpoints only."""
from fastapi import APIRouter, Depends

from app.modules.analytics.dependencies import get_analytics_service
from app.modules.analytics.schemas import AnalyticsResponse, TrustScoreResponse
from app.modules.analytics.service import AnalyticsService

router = APIRouter()


@router.get("/{seller_id}", response_model=AnalyticsResponse)
async def get_analytics(
    seller_id: int,
    force: bool = False,
    service: AnalyticsService = Depends(get_analytics_service),
):
    """Get aggregated analytics for a seller."""
    return await service.get_seller_analytics(seller_id, force=force)


@router.get("/{seller_id}/trust-score", response_model=TrustScoreResponse)
async def get_trust_score(
    seller_id: int,
    service: AnalyticsService = Depends(get_analytics_service),
):
    """Get the trust-score badge for a seller."""
    return await service.get_seller_trust_score(seller_id)