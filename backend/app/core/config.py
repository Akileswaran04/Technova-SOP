"""
Application configuration — environment variables loaded from .env.
"""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "TECHNOVA"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database — PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://technova:technova@localhost:5432/technova"
    DATABASE_ECHO: bool = False

    # Database — MongoDB (future)
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "technova"

    # Database — Redis (future)
    REDIS_URL: str = "redis://localhost:6379"

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # File Storage (future)
    STORAGE_BUCKET: str = "technova-storage"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
