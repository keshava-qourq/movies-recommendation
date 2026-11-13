"""Seeded admin and viewer passwords are stored only as salted Argon2 hashes."""

import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.bootstrap import seed_users
from app.config import Settings
from app.models import User
from app.security import verify_password


def test_ac005_nfr001_seeded_passwords_are_stored_as_salted_argon2(db_session: Session) -> None:
    admin_pw = secrets.token_urlsafe()
    smoke_pw = secrets.token_urlsafe()
    suffix = secrets.token_hex(4)
    settings = Settings(
        allowed_origins=[],
        secret_key="x",
        bootstrap_admin_email=f"admin-{suffix}@example.com",
        bootstrap_admin_password=admin_pw,
        smoke_test_email=f"smoke-{suffix}@example.com",
        smoke_test_password=smoke_pw,
    )

    seed_users(db_session, settings)

    users = {u.role: u for u in db_session.scalars(select(User)).all()}
    assert set(users) == {"admin", "viewer"}
    for role, pw in (("admin", admin_pw), ("viewer", smoke_pw)):
        stored = users[role].password_hash
        assert stored.startswith("$argon2")
        assert pw not in stored
        assert verify_password(stored, pw)
    assert users["admin"].password_hash != users["viewer"].password_hash
