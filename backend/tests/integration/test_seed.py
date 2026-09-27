from sqlmodel import Session, select

from app.models import Category, DeliveryArea, MenuItem, Promo, SampleTestimonial
from app.services import seed


def test_seed_produces_the_expected_catalogue(db_session: Session):
    assert db_session.exec(select(Category)).all().__len__() == 8
    assert db_session.exec(select(MenuItem)).all().__len__() == 33
    assert db_session.exec(select(DeliveryArea)).all().__len__() == 6
    assert db_session.exec(select(Promo)).all().__len__() == 2
    assert len(db_session.exec(select(SampleTestimonial)).all()) >= 1
    for area in db_session.exec(select(DeliveryArea)).all():
        assert area.fee == 150
        assert area.is_enabled is True


def test_seed_is_safe_to_run_twice(db_session: Session):
    before = len(db_session.exec(select(MenuItem)).all())
    report = seed.seed_all(db_session, reset_menu=False)
    db_session.flush()
    after = len(db_session.exec(select(MenuItem)).all())
    assert after == before
    assert report.total("inserted") == 0
    assert report.total("unchanged") > 0


def test_a_staff_price_edit_survives_reseeding_without_reset(db_session: Session):
    item = db_session.exec(select(MenuItem).where(MenuItem.slug == "burns-road-zinger")).one()
    item.base_price = 999
    item.is_sold_out = True
    db_session.flush()

    seed.seed_all(db_session, reset_menu=False)
    db_session.flush()
    db_session.refresh(item)
    assert item.base_price == 999
    assert item.is_sold_out is True


def test_reset_menu_overwrites_price_but_never_availability_flags(db_session: Session):
    item = db_session.exec(select(MenuItem).where(MenuItem.slug == "burns-road-zinger")).one()
    original_price = item.base_price
    item.base_price = 1
    item.is_sold_out = True
    item.is_available = False
    db_session.flush()

    seed.seed_all(db_session, reset_menu=True)
    db_session.flush()
    db_session.refresh(item)
    assert item.base_price == original_price
    assert item.is_sold_out is True
    assert item.is_available is False
