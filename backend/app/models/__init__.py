"""Importing this package registers every table on SQLModel.metadata (Alembic relies on it)."""

from app.models.content import ContactMessage, NewsletterSubscriber, Review, SampleTestimonial
from app.models.delivery import DeliveryArea
from app.models.menu import Category, CategoryAddon, CategoryOption, MenuItem, Promo
from app.models.orders import ORDER_STATUSES, Order, OrderLine, OrderStatusEvent
from app.models.users import User

__all__ = [
    "ORDER_STATUSES",
    "Category",
    "CategoryAddon",
    "CategoryOption",
    "ContactMessage",
    "DeliveryArea",
    "MenuItem",
    "NewsletterSubscriber",
    "Order",
    "OrderLine",
    "OrderStatusEvent",
    "Promo",
    "Review",
    "SampleTestimonial",
    "User",
]
