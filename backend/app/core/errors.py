"""One JSON error envelope for the whole API (research R9):

{"error": {"code": "...", "message": "...", "fields": {"a.b": "..."}, "details": {...}}}
"""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("kbg.errors")

# code -> HTTP status
STATUS: dict[str, int] = {
    "VALIDATION_FAILED": 422,
    "EMPTY_CART": 422,
    "UNKNOWN_ITEM": 422,
    "INVALID_OPTION": 422,
    "ITEM_SOLD_OUT": 409,
    "AREA_UNAVAILABLE": 422,
    "RESTAURANT_CLOSED": 409,
    "INVALID_SLOT": 422,
    "IDEMPOTENCY_CONFLICT": 409,
    "UNAUTHENTICATED": 401,
    "INVALID_CREDENTIALS": 401,
    "FORBIDDEN": 403,
    "ACCOUNT_EXISTS": 409,
    "NOT_FOUND": 404,
    "INVALID_TRANSITION": 409,
    "REVIEW_NOT_ALLOWED": 409,
    "RATE_LIMITED": 429,
    "INTERNAL": 500,
}

_HTTP_CODES = {
    401: "UNAUTHENTICATED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    422: "VALIDATION_FAILED",
    429: "RATE_LIMITED",
}


class AppError(Exception):
    """A business-rule failure with a customer-readable message."""

    def __init__(
        self,
        code: str,
        message: str,
        *,
        fields: dict[str, str] | None = None,
        details: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = STATUS[code]
        self.fields = fields
        self.details = details
        self.headers = headers


def envelope(
    code: str, message: str, fields: dict[str, str] | None = None, details: dict[str, Any] | None = None
) -> dict[str, Any]:
    body: dict[str, Any] = {"code": code, "message": message}
    if fields:
        body["fields"] = fields
    if details:
        body["details"] = details
    return {"error": body}


def _field_path(loc: tuple[Any, ...]) -> str:
    # Drop the "body"/"query"/"path" prefix; keep the rest as a dotted path.
    return ".".join(str(part) for part in loc[1:] if part != "__root__") or str(loc[0])


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            envelope(exc.code, exc.message, exc.fields, exc.details), status_code=exc.status, headers=exc.headers
        )

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        fields: dict[str, str] = {}
        for err in exc.errors():
            fields.setdefault(_field_path(tuple(err["loc"])), str(err["msg"]))
        return JSONResponse(
            envelope("VALIDATION_FAILED", "Please check the highlighted details.", fields), status_code=422
        )

    @app.exception_handler(RateLimitExceeded)
    async def _rate_limited(_: Request, exc: RateLimitExceeded) -> JSONResponse:
        return JSONResponse(
            envelope("RATE_LIMITED", "Too many attempts. Please wait a few minutes and try again."),
            status_code=429,
            headers={"Retry-After": "60"},
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = _HTTP_CODES.get(exc.status_code, "INTERNAL" if exc.status_code >= 500 else "VALIDATION_FAILED")
        message = "We could not find that." if exc.status_code == 404 else "The request could not be completed."
        return JSONResponse(envelope(code, message), status_code=exc.status_code, headers=exc.headers)

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
        return JSONResponse(
            envelope("INTERNAL", "Something went wrong on our side. Please try again."), status_code=500
        )
