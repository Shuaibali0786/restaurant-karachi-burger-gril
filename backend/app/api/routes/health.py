"""Liveness and database check. Not rate limited, so hosting health checks always work."""

import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlmodel import text

from app.api.deps import SessionDep
from app.core.errors import envelope

logger = logging.getLogger("kbg.health")

router = APIRouter(tags=["ops"])


@router.get("/healthz", summary="Liveness and database ping")
@router.get("/health", include_in_schema=False)  # root alias for host health checks
def healthz(session: SessionDep) -> JSONResponse:
    try:
        session.exec(text("SELECT 1"))  # type: ignore[call-overload]
    except Exception:
        logger.exception("Database health check failed")
        return JSONResponse(envelope("INTERNAL", "The database is not reachable."), status_code=503)
    return JSONResponse({"status": "ok"})
