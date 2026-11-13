"""Startup seeding: idempotent, and nothing when the settings are absent."""

import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.bootstrap import seed_users
from app.config import Settings
from app.models import User
from app.security import verify_password


def _settings(**overrides) -> Settings:
    base = dict(
        allowed_origins=[],
        secret_key="x",
        bootstrap_admin_email=None,
        bootstrap_admin_password=None,
        smoke_test_email=None,
        smoke_test_password=None,
    )
    base.update(overrides)
    return Settings(**base)


def test_seeds_nothing_without_settings(db_session: Session) -> None:
    seed_users(db_session, _settings())

    assert db_session.scalars(select(User)).all() == []


def test_seeds_admin_and_viewer_once(db_session: Session) -> None:
    admin_pw = secrets.token_urlsafe()
    smoke_pw = secrets.token_urlsafe()
    settings = _settings(
        bootstrap_admin_email="Admin@Example.com",
        bootstrap_admin_password=admin_pw,
        smoke_test_email="smoke@example.com",
        smoke_test_password=smoke_pw,
    )

    seed_users(db_session, settings)
    seed_users(db_session, settings)

    users = {u.email: u for u in db_session.scalars(select(User)).all()}
    assert set(users) == {"admin@example.com", "smoke@example.com"}
    assert users["admin@example.com"].role == "admin"
    assert users["smoke@example.com"].role == "viewer"
    assert verify_password(users["admin@example.com"].password_hash, admin_pw)
