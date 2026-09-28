"""Staff view of contact messages and newsletter sign-ups (contracts/openapi.yaml: admin tag)."""

from fastapi import APIRouter

from app.api.deps import AdminUser, SessionDep
from app.schemas.content import ContactMessageOut, ContactMessagePatch, SubscriberOut
from app.services import content as content_service

router = APIRouter(tags=["admin"])


@router.get("/contact-messages", summary="Messages, newest first")
def list_messages(session: SessionDep, _: AdminUser, unread: bool = False) -> list[ContactMessageOut]:
    return content_service.list_messages(session, unread_only=unread)


@router.patch("/contact-messages/{message_id}", summary="Mark a message read or unread")
def update_message(message_id: int, body: ContactMessagePatch, session: SessionDep, _: AdminUser) -> ContactMessageOut:
    return content_service.set_read(session, message_id, body.is_read)


@router.get("/newsletter-subscribers", summary="Newsletter sign-ups, newest first")
def list_subscribers(session: SessionDep, _: AdminUser) -> list[SubscriberOut]:
    return content_service.list_subscribers(session)
