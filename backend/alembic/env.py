"""Alembic environment.

The URL comes from backend/.env (DATABASE_URL_DIRECT, falling back to DATABASE_URL): migrations need
session-level features that Neon's pooled (PgBouncer) host does not guarantee (research R2).
Tests can pass a URL with `config.attributes["url"] = ...`.
"""

from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from sqlmodel import SQLModel

import app.models  # noqa: F401  (registers every table on SQLModel.metadata)
from alembic import context
from app.core.config import get_settings

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata


def _url() -> str:
    return config.attributes.get("url") or get_settings().migration_database_url


def run_migrations_offline() -> None:
    """Emit SQL without a database connection (`alembic upgrade head --sql`)."""
    context.configure(
        url=_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(_url(), poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
