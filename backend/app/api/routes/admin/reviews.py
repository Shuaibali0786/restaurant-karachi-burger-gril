"""Staff moderation of customer reviews (contracts/openapi.yaml: admin tag)."""

from fastapi import APIRouter

from app.api.deps import AdminUser, SessionDep
from app.schemas.reviews import AdminReviewOut, ModerateInput
from app.services import reviews as reviews_service

router = APIRouter(tags=["admin"])


@router.get("/reviews", summary="Reviews, pending first")
def list_reviews(session: SessionDep, _: AdminUser) -> list[AdminReviewOut]:
    return reviews_service.list_admin_reviews(session)


@router.patch("/reviews/{review_id}", summary="Approve or reject a review")
def moderate_review(review_id: int, body: ModerateInput, session: SessionDep, admin: AdminUser) -> AdminReviewOut:
    return reviews_service.moderate(session, review_id, body.status, admin)
