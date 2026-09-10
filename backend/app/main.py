"""
TECHNOVA Backend — AI-Powered Digital Business Ecosystem for MSMEs.

Architecture:
- PostgreSQL: Core business data (users, sellers, buyers, products, orders, payments, transactions, analytics)
- MongoDB: High-volume communication data (conversations, messages, AI drafts)
- Redis: Real-time features (online status, typing, unread, pub/sub, cache)
"""
import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.exceptions import (
    TechnovaException, NotFoundException, ConflictException,
    ValidationException, UnauthorizedException, ForbiddenException,
)
from app.infrastructure.mongodb import MongoDBClient
from app.infrastructure.mongodb.chat import ensure_chat_indexes
from app.infrastructure.redis import RedisClient
from app.modules.seller_profile.router import router as seller_profile_router
from app.modules.buyer_profile.router import router as buyer_profile_router
from app.modules.product_listing.router import router as product_listing_router
from app.modules.unified_inbox.router import router as unified_inbox_router
from app.modules.unified_inbox.ws import router as ws_router
from app.modules.unified_inbox.ws import start_realtime_forwarder, stop_realtime_forwarder
from app.modules.buyer_discovery.router import router as buyer_discovery_router
from app.modules.buyer_discovery.discovery_router import router as discovery_router
from app.modules.ai_communication.router import router as ai_communication_router
from app.modules.human_approval.router import router as human_approval_router
from app.modules.orders.router import router as orders_router
from app.modules.payments.router import router as payments_router
from app.modules.analytics.router import router as analytics_router
from app.modules.admin.router import router as admin_router
from app.modules.authentication.router import router as auth_router
from app.modules.api_integration.router import router as api_integration_router
from app.modules.analytics.worker import compute_all
from app.infrastructure.postgres.database import AsyncSessionLocal
from sqlalchemy import text

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

ANALYTICS_INTERVAL_SECONDS = 5 * 60  # recompute summaries every 5 minutes
DB_KEEPALIVE_INTERVAL_SECONDS = 60  # keep a scale-to-zero Neon compute warm


def create_app() -> FastAPI:
    app = FastAPI(
        title="TECHNOVA API",
        description="AI-Powered Digital Business Ecosystem for MSMEs",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # ============================================
    # Exception Handlers
    # ============================================

    @app.exception_handler(NotFoundException)
    async def not_found_handler(request: Request, exc: NotFoundException):
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(ConflictException)
    async def conflict_handler(request: Request, exc: ConflictException):
        return JSONResponse(status_code=409, content={"detail": str(exc)})

    @app.exception_handler(ValidationException)
    async def validation_handler(request: Request, exc: ValidationException):
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    @app.exception_handler(UnauthorizedException)
    async def unauthorized_handler(request: Request, exc: UnauthorizedException):
        return JSONResponse(status_code=401, content={"detail": str(exc)})

    @app.exception_handler(ForbiddenException)
    async def forbidden_handler(request: Request, exc: ForbiddenException):
        return JSONResponse(status_code=403, content={"detail": str(exc)})

    @app.exception_handler(TechnovaException)
    async def technova_handler(request: Request, exc: TechnovaException):
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    # ============================================
    # Middleware
    # ============================================

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ============================================
    # Lifecycle
    # ============================================

    analytics_task = None
    keepalive_task = None

    @app.on_event("startup")
    async def startup_event():
        """Initialize database connections, indexes, and background workers."""
        logger.info("Starting TECHNOVA Backend...")

        # MongoDB connection + chat indexes
        try:
            await MongoDBClient.connect_to_db()
            await ensure_chat_indexes()
            logger.info("MongoDB connected successfully")
        except Exception as e:
            logger.warning(f"MongoDB connection failed (optional service): {str(e)}")

        # Redis connection + realtime forwarder
        try:
            await RedisClient.connect_to_redis()
            start_realtime_forwarder()
            logger.info("Redis connected successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed (optional service): {str(e)}")

        # Background analytics worker (aggregates, never per-request)
        global analytics_task
        analytics_task = asyncio.create_task(_analytics_loop())

        # Keep the DB warm: hosted Postgres that scales to zero would otherwise
        # cold-start (seconds of latency) on the first request after idle.
        global keepalive_task
        keepalive_task = asyncio.create_task(_db_keepalive_loop())

        logger.info("TECHNOVA Backend startup complete")

    @app.on_event("shutdown")
    async def shutdown_event():
        """Clean up connections and background tasks."""
        logger.info("Shutting down TECHNOVA Backend...")

        if analytics_task is not None:
            analytics_task.cancel()
        if keepalive_task is not None:
            keepalive_task.cancel()
        stop_realtime_forwarder()

        try:
            await MongoDBClient.close_connection()
            logger.info("MongoDB connection closed")
        except Exception as e:
            logger.error(f"Error closing MongoDB: {str(e)}")

        try:
            await RedisClient.close_connection()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis: {str(e)}")

        logger.info("TECHNOVA Backend shutdown complete")

    async def _analytics_loop():
        """Periodically recompute analytics summaries + trust scores."""
        while True:
            try:
                await compute_all()
            except Exception as exc:  # noqa: BLE001
                logger.warning("Analytics worker iteration failed: %s", exc)
            await asyncio.sleep(ANALYTICS_INTERVAL_SECONDS)

    async def _db_keepalive_loop():
        """Lightweight Postgres ping so the compute stays warm between requests."""
        while True:
            try:
                async with AsyncSessionLocal() as session:
                    await session.execute(text("SELECT 1"))
            except Exception as exc:  # noqa: BLE001
                logger.warning("DB keep-alive ping failed: %s", exc)
            await asyncio.sleep(DB_KEEPALIVE_INTERVAL_SECONDS)

    # ============================================
    # API Routes
    # ============================================

    @app.get("/api/v1/health")
    async def health_check():
        """System health check endpoint."""
        return {
            "status": "healthy",
            "service": "technova-api",
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
        }

    # ============================================
    # Module Routers
    # ============================================

    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
    app.include_router(seller_profile_router, prefix="/api/v1/sellers", tags=["Seller Profile"])
    app.include_router(buyer_profile_router, prefix="/api/v1/buyers", tags=["Buyer Profile"])
    app.include_router(product_listing_router, prefix="/api/v1/products", tags=["Product Listing"])
    app.include_router(unified_inbox_router, prefix="/api/v1/conversations", tags=["Unified Inbox"])
    app.include_router(discovery_router, prefix="/api/v1", tags=["Buyer Discovery"])
    app.include_router(buyer_discovery_router, prefix="/api/v1/customers", tags=["Customer Management"])
    app.include_router(ai_communication_router, prefix="/api/v1/ai", tags=["AI Communication"])
    app.include_router(human_approval_router, prefix="/api/v1", tags=["Human Approval"])
    app.include_router(orders_router, prefix="/api/v1/orders", tags=["Orders"])
    app.include_router(payments_router, prefix="/api/v1", tags=["Payments"])
    app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
    app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
    app.include_router(api_integration_router, prefix="/api/v1", tags=["API Integration"])
    app.include_router(ws_router)  # /ws/chat

    return app


# Create FastAPI application
app = create_app()