"""Public contact form and newsletter (contracts/openapi.yaml: content tag). Both 5 per hour per IP."""

from fastapi import APIRouter, Request

from app.api.deps import SessionDep
from app.core.rate_limit import limiter
from app.schemas.content import ContactMessageInput, NewsletterInput
from app.schemas.reviews import TestimonialOut
from app.services import content as content_service
from app.services import reviews as reviews_service

router = APIRouter(tags=["content"])


@router.post("/contact-messages", status_code=201, summary="Save a contact form message")
@limiter.limit("5/hour")
def send_contact_message(
    request: Request,  # noqa: ARG001 - required by the slowapi decorator
    body: ContactMessageInput,
    session: SessionDep,
) -> dict[str, str]:
    content_service.save_contact_message(session, body)
    return {"status": "received"}


@router.post("/newsletter-subscriptions", summary="Subscribe an email (idempotent)")
@limiter.limit("5/hour")
def subscribe(
    request: Request,  # noqa: ARG001 - required by the slowapi decorator
    body: NewsletterInput,
    session: SessionDep,
) -> dict[str, str]:
    content_service.subscribe(session, body.email)
    return {"status": "subscribed"}


@router.get("/testimonials", summary="Approved reviews, or the labelled samples until there are at least three")
def testimonials(session: SessionDep) -> list[TestimonialOut]:
    return reviews_service.public_testimonials(session)
