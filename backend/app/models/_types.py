"""Column helpers shared by the table models."""

from sqlalchemy import Column, DateTime, func


def tstz(*, nullable: bool = False, now: bool = True) -> Column:  # type: ignore[type-arg]
    """A TIMESTAMPTZ column. With now=True the database fills it in (UTC-safe, no client clock)."""
    return Column(DateTime(timezone=True), nullable=nullable, server_default=func.now() if now else None)
