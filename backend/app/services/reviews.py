"""Reviews: a customer reviews their own Delivered order once, staff approve or reject it, and
approved reviews replace the labelled sample testimonials once there are at least three."""

import uuid
from datetime import datetime

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core import clock
from app.core.errors import AppError
from app.models import Order, Review, SampleTestimonial, User
from app.schemas.orders import ReviewSummaryOut
from app.schemas.reviews import AdminReviewOut, ReviewInput, TestimonialOut

MIN_REAL_REVIEWS = 3
MAX_SHOWN = 6

_NOT_ALLOWED = "You can review an order once it has been delivered, and only your own orders."


def get_review_for_order(session: Session, order_id: uuid.UUID) -> Review | None:
    return session.exec(select(Review).where(Review.order_id == order_id)).first()


def summary(review: Review | None) -> ReviewSummaryOut | None:
    if review is None:
        return None
    return ReviewSummaryOut(rating=review.rating, status=review.status)


def submit_review(session: Session, user: User, number: int, data: ReviewInput) -> ReviewSummaryOut:
    """Own order, Delivered, no review yet. The unique constraint on `order_id` settles a double tap."""
    order = session.exec(select(Order).where(Order.number == number)).first()
    if order is None or order.user_id != user.id or order.status != "delivered":
        raise AppError("REVIEW_NOT_ALLOWED", _NOT_ALLOWED)
    if get_review_for_order(session, order.id) is not None:
        raise AppError("REVIEW_NOT_ALLOWED", "You have already reviewed this order.")

    review = Review(order_id=order.id, user_id=user.id, rating=data.rating, comment=data.comment.strip())
    session.add(review)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise AppError("REVIEW_NOT_ALLOWED", "You have already reviewed this order.") from error
    session.refresh(review)
    return ReviewSummaryOut(rating=review.rating, status=review.status)


def _admin_out(review: Review, order: Order) -> AdminReviewOut:
    return AdminReviewOut(
        id=review.id or 0,
        order_id=f"KBG-{order.number}",
        customer_name=order.customer_name,
        area_name=order.area_name,
        rating=review.rating,
        comment=review.comment,
        status=review.status,
        created_at=review.created_at or clock.now(),
    )


def list_admin_reviews(session: Session) -> list[AdminReviewOut]:
    """Pending first (oldest waiting first), then everything else newest first."""
    rows = [(r, session.get(Order, r.order_id)) for r in session.exec(select(Review)).all()]
    pairs = [(r, o) for r, o in rows if o is not None]
    epoch = clock.now()
    pending = sorted((p for p in pairs if p[0].status == "pending"), key=lambda p: p[0].created_at or epoch)
    others = sorted(
        (p for p in pairs if p[0].status != "pending"), key=lambda p: p[0].created_at or epoch, reverse=True
    )
    return [_admin_out(r, o) for r, o in [*pending, *others]]


def moderate(session: Session, review_id: int, status: str, admin: User) -> AdminReviewOut:
    review = session.get(Review, review_id)
    order = session.get(Order, review.order_id) if review else None
    if review is None or order is None:
        raise AppError("NOT_FOUND", "We couldn't find that review.")
    review.status = status
    review.moderated_at = clock.now()
    review.moderated_by = admin.id
    session.add(review)
    session.commit()
    session.refresh(review)
    return _admin_out(review, order)


def _display_name(full_name: str) -> str:
    """First name plus last initial: "Sana Ahmed" -> "Sana A."."""
    parts = full_name.split()
    if not parts:
        return "Customer"
    return parts[0] if len(parts) == 1 else f"{parts[0]} {parts[-1][0].upper()}."


def _month(moment: datetime | None) -> str | None:
    return moment.astimezone(clock.PKT).strftime("%Y-%m") if moment else None


def public_testimonials(session: Session) -> list[TestimonialOut]:
    """The latest six approved reviews once at least three exist; otherwise the labelled samples."""
    approved = [r for r in session.exec(select(Review).where(Review.status == "approved")).all() if r.comment]
    if len(approved) >= MIN_REAL_REVIEWS:
        latest = sorted(approved, key=lambda r: r.created_at or clock.now(), reverse=True)[:MAX_SHOWN]
        result: list[TestimonialOut] = []
        for review in latest:
            order = session.get(Order, review.order_id)
            if order is None:
                continue
            result.append(
                TestimonialOut(
                    id=f"review-{review.id}",
                    name=_display_name(order.customer_name),
                    area=order.area_name,
                    quote=review.comment or "",
                    rating=review.rating,
                    month=_month(review.created_at),
                    is_sample=False,
                )
            )
        return result
    samples = sorted(session.exec(select(SampleTestimonial)).all(), key=lambda t: t.id)
    return [
        TestimonialOut(id=t.id, name=t.name, area=t.area, quote=t.quote, rating=t.rating, is_sample=True)
        for t in samples
    ]
