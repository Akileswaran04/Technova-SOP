"""MongoDB database client initialization and connection management."""
import logging
from typing import Optional

from motor.motor_asyncio import AsyncClient, AsyncDatabase
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class MongoDBSettings(BaseSettings):
    """MongoDB configuration."""

    model_config = ConfigDict(env_prefix="mongodb_", case_sensitive=False)

    uri: str
    db: str = "technova"


mongodb_settings = MongoDBSettings()


class MongoDBClient:
    """MongoDB async client wrapper."""

    client: Optional[AsyncClient] = None
    db: Optional[AsyncDatabase] = None

    @classmethod
    async def connect_to_db(cls) -> None:
        """Create connection to MongoDB."""
        try:
            logger.info("Connecting to MongoDB...")
            cls.client = AsyncClient(mongodb_settings.uri)
            # Verify connection
            await cls.client.admin.command("ping")
            cls.db = cls.client[mongodb_settings.db]
            logger.info(f"Connected to MongoDB database: {mongodb_settings.db}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise

    @classmethod
    async def close_connection(cls) -> None:
        """Close MongoDB connection."""
        if cls.client is not None:
            cls.client.close()
            logger.info("MongoDB connection closed")

    @classmethod
    async def get_database(cls) -> AsyncDatabase:
        """Get MongoDB database instance."""
        if cls.db is None:
            await cls.connect_to_db()
        return cls.db


async def get_mongodb() -> AsyncDatabase:
    """Dependency for getting MongoDB database."""
    return await MongoDBClient.get_database()
