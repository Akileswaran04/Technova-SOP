"""
Async SQLAlchemy engine and session factory for PostgreSQL.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    # pool_pre_ping is deliberately OFF: against the hosted Neon pooler it adds
    # a ping round trip before every checkout that cost ~1.5s per query here.
    # pool_recycle proactively swaps out connections before the pooler kills
    # idle ones, so stale connections are replaced without per-request pings.
    pool_pre_ping=False,
    pool_recycle=300,
    pool_size=20,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
