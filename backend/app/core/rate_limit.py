"""Rate limiting (slowapi) and the failed-login lockout (research R8).

slowapi counts every request; the lockout counts only failures, so it is built directly on the
`limits` library that slowapi already depends on. Storage is in memory: single backend instance.
"""

from fastapi import Request
from limits import parse
from limits.storage import storage_from_string
from limits.strategies import MovingWindowRateLimiter
from slowapi import Limiter

from app.core.config import get_settings


def client_ip(request: Request) -> str:
    """Left-most X-Forwarded-For entry, only when TRUST_PROXY=true; otherwise the socket address."""
    if get_settings().trust_proxy:
        forwarded = request.headers.get("x-forwarded-for", "")
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    return request.client.host if request.client else "unknown"


def _build_limiter() -> Limiter:
    settings = get_settings()
    return Limiter(
        key_func=client_ip,
        storage_uri=settings.ratelimit_storage_uri,
        strategy="moving-window",
        enabled=settings.ratelimit_enabled,
        headers_enabled=False,
    )


limiter = _build_limiter()


class LoginGuard:
    """Blocks an (IP, identifier) pair after 5 failed logins in 15 minutes."""

    def __init__(self, storage_uri: str, enabled: bool = True, rate: str = "5/15 minutes") -> None:
        self._storage = storage_from_string(storage_uri)
        self._limiter = MovingWindowRateLimiter(self._storage)
        self._item = parse(rate)
        self._enabled = enabled

    @staticmethod
    def _key(ip: str, identifier: str) -> tuple[str, str]:
        return ip, identifier.strip().lower()

    def is_blocked(self, ip: str, identifier: str) -> bool:
        # `test` reports whether one more hit is still allowed, without consuming it.
        return self._enabled and not self._limiter.test(self._item, *self._key(ip, identifier))

    def record_failure(self, ip: str, identifier: str) -> None:
        if self._enabled:
            self._limiter.hit(self._item, *self._key(ip, identifier))

    def reset(self, ip: str, identifier: str) -> None:
        self._storage.clear(self._item.key_for(*self._key(ip, identifier)))

    def clear_all(self) -> None:
        """Forget every recorded failure (used between tests)."""
        self._storage.reset()


def _build_guard() -> LoginGuard:
    settings = get_settings()
    return LoginGuard(settings.ratelimit_storage_uri, settings.ratelimit_enabled)


login_guard = _build_guard()
