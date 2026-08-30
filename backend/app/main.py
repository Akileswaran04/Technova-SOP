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

from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.exceptions import TechnovaException, NotFoundException, ConflictException, ValidationException, UnauthorizedException, ForbiddenException
from app.infrastructure.mongodb import MongoDBClient
from app.infrastructure.redis import RedisClient
from app.modules.seller_profile.router import router as seller_profile_router
from app.modules.product_listing.router import router as product_listing_router
from app.modules.unified_inbox.router import router as unified_inbox_router
from app.modules.buyer_discovery.router import router as buyer_discovery_router
from app.modules.ai_communication.router import router as ai_communication_router
from app.modules.authentication.router import router as auth_router

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

    # Seller Profile Module
    app.include_router(seller_profile_router, prefix="/api/v1/sellers", tags=["Seller Profile"])

    # Product Listing Module
    app.include_router(product_listing_router, prefix="/api/v1/products", tags=["Product Listing"])

    # Unified Inbox Module
    app.include_router(unified_inbox_router, prefix="/api/v1/conversations", tags=["Unified Inbox"])

    # Buyer Discovery Module
    app.include_router(buyer_discovery_router, prefix="/api/v1/customers", tags=["Buyer Discovery"])

    # AI Communication Module
    app.include_router(ai_communication_router, prefix="/api/v1/ai", tags=["AI Communication"])

    # Authentication Module
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])

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
                        "product_reviews",
                        "orders",
                        "order_items",
                        "transactions",
                        "reviews",
                        "trust_scores",
                        "analytics",
                        "audit_logs",
                        "conversations",
                        "messages",
                        "customers",
                        "ai_interactions",
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
            },                "modules": {
                "seller_profile": "IMPLEMENTED",
                "product_listing": "IMPLEMENTED",
                "unified_inbox": "IMPLEMENTED",
                "buyer_discovery": "IMPLEMENTED",
                "ai_communication": "IMPLEMENTED",
                "authentication": "PLANNED",
                "human_approval": "PLANNED",
                "analytics": "PLANNED",
                "api_integration": "PLANNED",
                "admin": "PLANNED",
            },
        }

    return app


# Create FastAPI application
app = create_app()
