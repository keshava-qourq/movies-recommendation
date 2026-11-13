"""Startup seeding of the first admin and the smoke-test viewer.

Both are idempotent (created only when no user with that email exists) and seed nothing
unless both settings of a pair are set. The bundled sample catalog is loaded by a later
ticket, which adds its step to `run_startup`.
"""

import json
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.models import Movie, User
from app.security import hash_password, normalize_email

logger = logging.getLogger("app.bootstrap")

SAMPLE_MOVIES_PATH = Path(__file__).resolve().parent / "data" / "sample_movies.json"


def seed_movies(db: Session, path: Path = SAMPLE_MOVIES_PATH) -> int:
    """Insert sample movies missing by (lowercased trimmed title, year); touch nothing else."""
    entries = json.loads(path.read_text(encoding="utf-8"))
    existing = set(db.execute(select(Movie.title_key, Movie.year)).all())
    added = 0
    for e in entries:
        key = (e["title"].strip().lower(), e["year"])
        if key in existing:
            continue
        existing.add(key)
        db.add(
            Movie(
                title=e["title"].strip(),
                title_key=key[0],
                year=e["year"],
                genres=e["genres"],
                director=e["director"],
                cast_members=e["cast"],
                plot=e["plot"],
            )
        )
        added += 1
    try:
        db.commit()
    except IntegrityError:
        # Another worker seeded the catalog first.
        db.rollback()
        return 0
    return added


def _ensure_user(db: Session, email: str, password: str, role: str) -> bool:
    email = normalize_email(email)
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        return False
    db.add(User(email=email, password_hash=hash_password(password), role=role))
    try:
        db.commit()
    except IntegrityError:
        # Another worker seeded the same user first.
        db.rollback()
        return False
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
