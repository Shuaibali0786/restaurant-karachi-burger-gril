"""Contact messages and newsletter sign-ups: saved by the website, read by staff."""

from sqlalchemy.dialects.postgresql import insert
from sqlmodel import Session, select

from app.core import clock
from app.core.errors import AppError
from app.core.normalise import normalise_email, normalise_pk_mobile
from app.models import ContactMessage, NewsletterSubscriber
from app.schemas.content import ContactMessageInput, ContactMessageOut, SubscriberOut


def _message_out(message: ContactMessage) -> ContactMessageOut:
    return ContactMessageOut(
        id=message.id or 0,
        name=message.name,
        phone=message.phone,
        email=message.email,
        message=message.message,
        is_read=message.is_read,
        created_at=message.created_at or clock.now(),
    )


def save_contact_message(session: Session, data: ContactMessageInput) -> None:
    """Stored as plain text exactly as typed (the pages escape it when showing it), with the phone
    and email normalised so staff can call or reply."""
    phone = None
    if data.phone and data.phone.strip():
        phone = normalise_pk_mobile(data.phone)
        if phone is None:
            raise AppError(
                "VALIDATION_FAILED",
                "Please check your details.",
                fields={"phone": "Enter a valid Pakistani mobile number."},
            )
    email = None
    if data.email and data.email.strip():
        email = normalise_email(data.email)
        if email is None:
            raise AppError(
                "VALIDATION_FAILED", "Please check your details.", fields={"email": "Enter a valid email address."}
            )
    session.add(ContactMessage(name=data.name.strip(), phone=phone, email=email, message=data.message.strip()))
    session.commit()


def subscribe(session: Session, raw_email: str) -> None:
    """Idempotent: subscribing an email twice is a success and creates no second row."""
    email = normalise_email(raw_email)
    if email is None:
        raise AppError(
            "VALIDATION_FAILED", "Please check your details.", fields={"email": "Enter a valid email address."}
        )
    statement = insert(NewsletterSubscriber).values(email=email, created_at=clock.now()).on_conflict_do_nothing()
    session.execute(statement)
    session.commit()


def list_messages(session: Session, *, unread_only: bool = False) -> list[ContactMessageOut]:
    messages = session.exec(select(ContactMessage)).all()
    if unread_only:
        messages = [m for m in messages if not m.is_read]
    messages = sorted(messages, key=lambda m: (m.created_at or clock.now(), m.id or 0), reverse=True)
    return [_message_out(m) for m in messages]


def set_read(session: Session, message_id: int, is_read: bool) -> ContactMessageOut:
    message = session.get(ContactMessage, message_id)
    if message is None:
        raise AppError("NOT_FOUND", "We couldn't find that message.")
    message.is_read = is_read
    session.add(message)
    session.commit()
    session.refresh(message)
    return _message_out(message)


def list_subscribers(session: Session) -> list[SubscriberOut]:
    subscribers = sorted(
        session.exec(select(NewsletterSubscriber)).all(), key=lambda s: s.created_at or clock.now(), reverse=True
    )
    return [SubscriberOut(email=s.email, created_at=s.created_at) for s in subscribers if s.created_at]
