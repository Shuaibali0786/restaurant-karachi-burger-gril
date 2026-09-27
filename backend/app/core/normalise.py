"""Phone and email normalisation. Phone rules match frontend/src/lib/phone.ts exactly."""

import re

_PK_MOBILE = re.compile(r"^(?:\+92|0092|92|0)3\d{9}$")
_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalise_pk_mobile(value: str) -> str | None:
    """Return the number as +923XXXXXXXXX, or None if it is not a Pakistani mobile."""
    compact = re.sub(r"[\s-]", "", value.strip())
    return f"+92{compact[-10:]}" if _PK_MOBILE.match(compact) else None


def normalise_email(value: str) -> str | None:
    """Trim and lowercase; None if it does not look like an email or is over 254 characters."""
    email = value.strip().lower()
    return email if len(email) <= 254 and _EMAIL.match(email) else None
