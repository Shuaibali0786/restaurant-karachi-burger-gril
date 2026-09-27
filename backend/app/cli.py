"""Command line tools. Run from backend/:  uv run python -m app.cli <command>

seed [--reset-menu]     load categories, the 33 menu items, promos, delivery areas and sample reviews
create-admin            create the first admin from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME in .env
set-order-status        move an order to its next status, or cancel it (stand-in for the admin panel)
check-db                verify the database connection (prints no secrets)
"""

import argparse
import sys

from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlmodel import Session, select

from app.core.config import get_settings
from app.core.db import get_engine
from app.core.errors import AppError
from app.core.security import hash_password
from app.models import Order, User
from app.services import orders as orders_service
from app.services import seed

MIN_ADMIN_PASSWORD_LENGTH = 12


def cmd_check_db(_: argparse.Namespace) -> int:
    engine = get_engine()
    url = make_url(str(engine.url))
    print(f"Connecting to host {url.host}, database {url.database} ...")
    try:
        with engine.connect() as connection:
            version = connection.execute(text("select version()")).scalar_one()
            tables = connection.execute(
                text("select count(*) from information_schema.tables where table_schema = 'public'")
            ).scalar_one()
    except Exception as error:  # noqa: BLE001 - report any failure in plain words
        print(f"FAILED: {type(error).__name__}. Check DATABASE_URL in backend/.env (see .env.example).")
        return 1
    print(f"OK: connected. {version.split(',')[0]}. Tables in schema 'public': {tables}.")
    return 0


def cmd_seed(args: argparse.Namespace) -> int:
    with Session(get_engine()) as session:
        report = seed.seed_all(session, reset_menu=args.reset_menu)
        session.commit()
    for table in sorted(set(report.inserted) | set(report.updated) | set(report.unchanged)):
        print(
            f"  {table:<20} inserted {report.inserted.get(table, 0):>3}"
            f"  updated {report.updated.get(table, 0):>3}  unchanged {report.unchanged.get(table, 0):>3}"
        )
    print(
        f"Done: {report.total('inserted')} inserted, "
        f"{report.total('updated')} updated, {report.total('unchanged')} unchanged."
    )
    return 0


def cmd_create_admin(_: argparse.Namespace) -> int:
    settings = get_settings()
    email = (settings.admin_email or "").strip().lower()
    password = settings.admin_password or ""
    if not email or not password:
        print("FAILED: set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env first (see .env.example).")
        return 1
    if len(password) < MIN_ADMIN_PASSWORD_LENGTH:
        print(f"FAILED: ADMIN_PASSWORD must be at least {MIN_ADMIN_PASSWORD_LENGTH} characters.")
        return 1

    with Session(get_engine()) as session:
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing is not None:
            print(f"Admin account for {email} already exists (role: {existing.role}). Nothing to do.")
            return 0
        session.add(User(name=settings.admin_name, email=email, password_hash=hash_password(password), role="admin"))
        session.commit()
    print(f"OK: admin account created for {email}.")
    return 0


def cmd_set_order_status(args: argparse.Namespace) -> int:
    with Session(get_engine()) as session:
        order = session.exec(select(Order).where(Order.number == args.number)).first()
        if order is None:
            print(f"FAILED: no order KBG-{args.number}.")
            return 1
        try:
            updated = orders_service.change_status(session, order, args.status, changed_by=None)
        except AppError as error:
            print(f"FAILED: {error.message}")
            return 1
    print(f"OK: {updated.id} is now {updated.status}.")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli", description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    seed_parser = sub.add_parser("seed", help="load the menu, areas and sample reviews (safe to re-run)")
    seed_parser.add_argument(
        "--reset-menu", action="store_true", help="development only: overwrite menu fields from the JSON"
    )
    seed_parser.set_defaults(func=cmd_seed)
    sub.add_parser("check-db", help="verify the database connection").set_defaults(func=cmd_check_db)
    sub.add_parser("create-admin", help="create the first admin from .env (safe to re-run)").set_defaults(
        func=cmd_create_admin
    )
    status_parser = sub.add_parser(
        "set-order-status", help="move an order forward one step, or cancel it (stand-in for the admin panel)"
    )
    status_parser.add_argument("number", type=int, help="the order number, e.g. 10234 for KBG-10234")
    status_parser.add_argument("status", choices=["preparing", "on-the-way", "delivered", "cancelled"])
    status_parser.set_defaults(func=cmd_set_order_status)
    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    sys.exit(main())
