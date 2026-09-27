"""Database engine (sync SQLModel over psycopg 3) and the per-request session dependency."""

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine
from sqlmodel import Session, create_engine

from app.core.config import get_settings


def build_engine(url: str) -> Engine:
    """Neon-friendly engine: pooled host, pre-ping (Neon closes idle connections), no server-side
    prepared statements (PgBouncer transaction pooling does not support them)."""
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=5,
        connect_args={"prepare_threshold": None},
    )


@lru_cache
def get_engine() -> Engine:
    return build_engine(get_settings().database_url)


def get_session() -> Iterator[Session]:
    with Session(get_engine()) as session:
        yield session
