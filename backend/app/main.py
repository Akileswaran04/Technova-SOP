"""
TECHNOVA Backend — AI-Powered Digital Business Ecosystem for MSMEs.

Architecture:
- PostgreSQL: Core business data (users, sellers, products, orders, reviews, analytics)
- MongoDB: High-volume communication data (conversations, messages, AI logs)
- Redis: Real-time features (online status, caching, pub/sub)
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.infrastructure.mongodb import MongoDBClient
from app.infrastructure.redis import RedisClient
from app.modules.seller_profile.router import router as seller_profile_router

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


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
    # Middleware
    # ============================================

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ============================================
    # Startup Event
    # ============================================

    @app.on_event("startup")
    async def startup_event():
        """Initialize database connections and services."""
        logger.info("Starting TECHNOVA Backend...")

        # PostgreSQL is initialized through SQLAlchemy session
        # (configured in infrastructure/postgres/session.py)
        logger.info("PostgreSQL connection pool initialized")

        # MongoDB connection
        try:
            await MongoDBClient.connect_to_db()
            logger.info("MongoDB connected successfully")
        except Exception as e:
            logger.warning(f"MongoDB connection failed (optional service): {str(e)}")

        # Redis connection
        try:
            await RedisClient.connect_to_redis()
            logger.info("Redis connected successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed (optional service): {str(e)}")

        logger.info("TECHNOVA Backend startup complete")

    # ============================================
    # Shutdown Event
    # ============================================

    @app.on_event("shutdown")
    async def shutdown_event():
        """Clean up database connections."""
        logger.info("Shutting down TECHNOVA Backend...")

        # Close MongoDB
        try:
            await MongoDBClient.close_connection()
            logger.info("MongoDB connection closed")
        except Exception as e:
            logger.error(f"Error closing MongoDB: {str(e)}")

        # Close Redis
        try:
            await RedisClient.close_connection()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis: {str(e)}")

        logger.info("TECHNOVA Backend shutdown complete")

    # ============================================
    # API Routes
    # ============================================

    # Health check
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

    # Seller Profile Module (Implemented)
    app.include_router(seller_profile_router, prefix="/api/v1/sellers", tags=["Seller Profile"])

    # Future modules will be registered here:
    # app.include_router(authentication_router, prefix="/api/v1/auth", tags=["Authentication"])
    # app.include_router(buyer_discovery_router, prefix="/api/v1/buyers", tags=["Buyer Discovery"])
    # app.include_router(product_listing_router, prefix="/api/v1/products", tags=["Product Listing"])
    # app.include_router(unified_inbox_router, prefix="/api/v1/conversations", tags=["Unified Inbox"])
    # app.include_router(ai_communication_router, prefix="/api/v1/ai", tags=["AI Communication"])
    # app.include_router(human_approval_router, prefix="/api/v1/admin/approvals", tags=["Human Approval"])
    # app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
    # app.include_router(api_integration_router, prefix="/api/v1/integrations", tags=["API Integration"])
    # app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])

    # ============================================
    # API Documentation Sections
    # ============================================

    @app.get("/api/v1/docs/architecture")
    async def get_architecture_docs():
        """Get architecture documentation."""
        return {
            "name": "TECHNOVA Architecture",
            "version": "1.0.0",
            "databases": {
                "PostgreSQL": {
                    "purpose": "Core business data",
                    "url": settings.DATABASE_URL.split("@")[1] if "@" in settings.DATABASE_URL else "configured",
                    "tables": [
                        "users",
                        "seller_profiles",
                        "seller_verifications",
                        "buyer_profiles",
                        "products",
                        "orders",
                        "order_items",
                        "transactions",
                        "reviews",
                        "trust_scores",
                        "analytics",
                        "audit_logs",
                    ],
                },
                "MongoDB": {
                    "purpose": "High-volume communication data",
                    "status": "Optional - for future modules",
                    "collections": ["conversations", "messages", "ai_interactions", "notification_queue"],
                },
                "Redis": {
                    "purpose": "Real-time features and caching",
                    "status": "Optional - for real-time features",
                    "use_cases": ["online_status", "typing_indicators", "cache", "pub_sub"],
                },
            },
            "modules": {
                "seller_profile": "IMPLEMENTED",
                "authentication": "PLANNED",
                "product_listing": "PLANNED",
                "buyer_discovery": "PLANNED",
                "unified_inbox": "PLANNED",
                "ai_communication": "PLANNED",
                "human_approval": "PLANNED",
                "analytics": "PLANNED",
                "api_integration": "PLANNED",
                "admin": "PLANNED",
            },
        }

    return app


# Create FastAPI application
app = create_app()
