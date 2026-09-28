"""FastAPI application factory. Run with: uv run fastapi dev app/main.py --port 8000 (docs at /docs)."""

import json
import logging
import time
import uuid
from collections.abc import Awaitable, Callable
from urllib.parse import urlparse

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, content, health, me, menu, orders
from app.api.routes.admin import areas as admin_areas
from app.api.routes.admin import auth as admin_auth
from app.api.routes.admin import menu as admin_menu
from app.api.routes.admin import messages as admin_messages
from app.api.routes.admin import orders as admin_orders
from app.api.routes.admin import summary as admin_summary
from app.core.config import get_settings
from app.core.errors import envelope, install_error_handlers
from app.core.rate_limit import limiter

API_PREFIX = "/api/v1"
MUTATING = {"POST", "PUT", "PATCH", "DELETE"}

access_log = logging.getLogger("kbg.access")


def _origin_allowed(request: Request, allowed: list[str]) -> bool:
    """An Origin header is fine if it is our website, or this service itself (the /docs page)."""
    origin = request.headers.get("origin")
    if origin is None:
        return True  # not a browser cross-origin request (curl, server-to-server, tests)
    origin = origin.rstrip("/")
    return origin in allowed or urlparse(origin).netloc == request.headers.get("host")


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level.upper(), format="%(message)s")

    app = FastAPI(
        title="Karachi Burger & Grill API",
        version="1.0.0",
        description="Backend for the Karachi Burger & Grill website. Money is integer PKR; JSON is camelCase.",
    )
    app.state.limiter = limiter
    install_error_handlers(app)

    @app.middleware("http")
    async def guard_and_log(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        request_id = uuid.uuid4().hex[:12]
        started = time.perf_counter()
        response: Response | None = None

        if request.method in MUTATING:
            if not _origin_allowed(request, settings.frontend_origins):
                response = JSONResponse(envelope("FORBIDDEN", "This request is not allowed."), status_code=403)
            else:
                has_body = request.headers.get("content-length", "0") != "0" or "transfer-encoding" in request.headers
                content_type = request.headers.get("content-type", "")
                if has_body and not content_type.lower().startswith("application/json"):
                    response = JSONResponse(
                        envelope("VALIDATION_FAILED", "Requests must be sent as JSON."), status_code=415
                    )

        if response is None:
            response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        # Method, path, status and timing only: never bodies, cookies or personal data.
        access_log.info(
            json.dumps(
                {
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "ms": round((time.perf_counter() - started) * 1000),
                }
            )
        )
        return response

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.frontend_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Idempotency-Key"],
    )

    app.include_router(health.router, prefix=API_PREFIX)
    app.include_router(health.router)  # /health and /healthz at the root too, for host health checks
    app.include_router(menu.router, prefix=API_PREFIX)
    app.include_router(orders.router, prefix=API_PREFIX)
    app.include_router(auth.router, prefix=API_PREFIX)
    app.include_router(me.router, prefix=API_PREFIX)
    app.include_router(content.router, prefix=API_PREFIX)
    admin_prefix = f"{API_PREFIX}/admin"
    app.include_router(admin_auth.router, prefix=admin_prefix)
    app.include_router(admin_menu.router, prefix=admin_prefix)
    app.include_router(admin_areas.router, prefix=admin_prefix)
    app.include_router(admin_orders.router, prefix=admin_prefix)
    app.include_router(admin_summary.router, prefix=admin_prefix)
    app.include_router(admin_messages.router, prefix=admin_prefix)
    return app


app = create_app()
