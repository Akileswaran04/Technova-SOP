"""Analytics Service — read analytics/trust scores, compute on demand if stale."""
import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.analytics.models import AnalyticsSummary, TrustScore
from app.modules.analytics.worker import compute_for_seller
from app.core.exceptions import NotFoundException

logger = logging.getLogger(__name__)

# In-flight refreshes, so concurrent tab loads don't stack duplicate computations
_refresh_in_progress: set[int] = set()


class AnalyticsService:
    """Business logic for analytics."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_seller_analytics(self, seller_id: int, force: bool = False) -> dict:
        result = await self.db.execute(
            select(AnalyticsSummary)
            .where(AnalyticsSummary.seller_id == seller_id)
            .order_by(AnalyticsSummary.id.desc())
            .limit(1)
        )
        summary = result.scalar_one_or_none()

        # Background worker computes normally; compute on first request if empty/stale
        stale = False
        if summary is not None:
            created = summary.created_at
            if created and created.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc) - timedelta(minutes=30):
                stale = True
        if force or summary is None:
            # First-ever request: nothing to serve yet, must compute synchronously
            await compute_for_seller(seller_id)
            result = await self.db.execute(
                select(AnalyticsSummary)
                .where(AnalyticsSummary.seller_id == seller_id)
                .order_by(AnalyticsSummary.id.desc())
                .limit(1)
            )
            summary = result.scalar_one_or_none()
        elif stale:
            # Stale: serve the existing summary now and refresh in the background.
            # Awaiting the recompute here blocked the tab load for seconds.
            if seller_id not in _refresh_in_progress:
                _refresh_in_progress.add(seller_id)
                task = asyncio.create_task(compute_for_seller(seller_id))
                task.add_done_callback(lambda _: _refresh_in_progress.discard(seller_id))
            else:
                logger.debug("Analytics refresh already running for seller %s", seller_id)

        if summary is None:
            raise NotFoundException("Analytics", str(seller_id))

        return {
            "seller_id": seller_id,
            "total_orders": summary.total_orders,
            "total_revenue": summary.total_revenue,
            "average_order_value": summary.average_order_value,
            "conversion_rate": summary.conversion_rate,
            "response_time_avg": summary.response_time_avg,
            "period": summary.date,
            "computed_at": summary.created_at,
        }

    async def get_seller_trust_score(self, seller_id: int) -> dict:
        result = await self.db.execute(
            select(TrustScore).where(TrustScore.seller_id == seller_id)
        )
        trust = result.scalar_one_or_none()
        if trust is None:
            # Compute on first request so discovery badges work immediately.
            # Synchronous because there is nothing to serve otherwise.
            await compute_for_seller(seller_id)
            result = await self.db.execute(
                select(TrustScore).where(TrustScore.seller_id == seller_id)
            )
            trust = result.scalar_one_or_none()
        if trust is None:
            raise NotFoundException("TrustScore", str(seller_id))

        return {
            "seller_id": seller_id,
            "overall_score": trust.overall_score,
            "review_score": trust.review_score,
            "compliance_score": trust.compliance_score,
            "communication_score": trust.communication_score,
            "successful_orders": trust.successful_orders,
            "cancellation_rate": trust.cancellation_rate,
            "last_updated": trust.last_updated,
        }