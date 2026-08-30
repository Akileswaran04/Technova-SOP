"""
TECHNOVA Backend — AI-Powered Digital Business Ecosystem for MSMEs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.seller_profile.router import router as seller_profile_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="TECHNOVA API",
        description="AI-Powered Digital Business Ecosystem for MSMEs",
        version="0.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register module routers
    app.include_router(seller_profile_router, prefix="/api/v1/sellers", tags=["Seller Profile"])

    @app.get("/api/v1/health")
    def health_check():
        return {"status": "healthy", "service": "technova-api"}

    return app


app = create_app()
