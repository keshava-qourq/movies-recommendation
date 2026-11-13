"""Startup seeding of the first admin and the smoke-test viewer.

Both are idempotent (created only when no user with that email exists) and seed nothing
unless both settings of a pair are set. The bundled sample catalog is loaded by a later
ticket, which adds its step to `run_startup`.
"""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.models import User
from app.security import hash_password

logger = logging.getLogger("app.bootstrap")


def _ensure_user(db: Session, email: str, password: str, role: str) -> bool:
    email = email.strip().lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        return False
    db.add(User(email=email, password_hash=hash_password(password), role=role))
    db.commit()
    return True


def seed_users(db: Session, settings: Settings | None = None) -> None:
    settings = settings or get_settings()
    if settings.bootstrap_admin_email and settings.bootstrap_admin_password:
        _ensure_user(db, settings.bootstrap_admin_email, settings.bootstrap_admin_password, "admin")
    else:
        logger.warning(
            "BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD not set: no admin account seeded"
        )
    if settings.smoke_test_email and settings.smoke_test_password:
        _ensure_user(db, settings.smoke_test_email, settings.smoke_test_password, "viewer")
