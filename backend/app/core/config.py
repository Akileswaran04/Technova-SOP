"""
Application configuration — environment variables loaded from .env.

The project .env is authoritative: we load it with override=True so a stale
DATABASE_URL/MONGODB_URL/REDIS_URL in the process environment can't silently
win over the checked-in local config.
"""

from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

_env_path = Path(__file__).resolve().parents[2] / ".env"
if _env_path.exists():
    load_dotenv(_env_path, override=True)


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

    # Public base URL (OAuth redirects / demo links)
    PUBLIC_BASE_URL: str = "http://localhost:8000"

    # External AI providers
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # External integrations — Gmail / Microsoft Graph OAuth (empty = mock mode)
    GMAIL_CLIENT_ID: Optional[str] = None
    GMAIL_CLIENT_SECRET: Optional[str] = None
    GMAIL_REDIRECT_URI: Optional[str] = None
    MICROSOFT_CLIENT_ID: Optional[str] = None
    MICROSOFT_CLIENT_SECRET: Optional[str] = None
    MICROSOFT_REDIRECT_URI: Optional[str] = None

    # File Storage (future)
    STORAGE_BUCKET: str = "technova-storage"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
