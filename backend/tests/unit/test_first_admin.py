"""First-admin seeding and the admin guard (AC-011 to AC-014, NFR-001, NFR-005, NFR-010)."""

import logging
import secrets

from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.bootstrap import seed_users
from app.config import Settings
from app.deps import require_admin
from app.main import app
from app.models import User


def _settings(**kw) -> Settings:
    base = dict(
        allowed_origins=[],
        secret_key="x",
        bootstrap_admin_email=None,
        bootstrap_admin_password=None,
        smoke_test_email=None,
        smoke_test_password=None,
    )
    base.update(kw)
    return Settings(**base)


def test_ac011_admin_created_and_can_log_in(db_session: Session, client: TestClient) -> None:
    pw = secrets.token_urlsafe()
    email = f"  Boss-{secrets.token_hex(4)}@Example.com "
    seed_users(db_session, _settings(bootstrap_admin_email=email, bootstrap_admin_password=pw))
    res = client.post("/auth/login", json={"email": email.upper(), "password": pw})
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "admin"
    assert res.json()["user"]["email"] == email.strip().lower()
    stored = db_session.scalar(select(User.password_hash))
    assert stored.startswith("$argon2") and stored != pw


def test_ac012_restarts_keep_one_admin_and_hash(db_session: Session) -> None:
    pw = secrets.token_urlsafe()
    settings = _settings(
        bootstrap_admin_email=f"a-{secrets.token_hex(4)}@example.com", bootstrap_admin_password=pw
    )
    seed_users(db_session, settings)
    first = db_session.scalar(select(User.password_hash))
    for _ in range(3):
        seed_users(db_session, settings)
    db_session.expire_all()
    assert db_session.scalar(select(func.count()).select_from(User)) == 1
    assert db_session.scalar(select(User.password_hash)) == first


def test_ac013_unset_or_half_set_warns_and_seeds_nothing(db_session: Session, caplog) -> None:
    for kw in (
        {},
        {"bootstrap_admin_email": "x@example.com"},
        {"bootstrap_admin_password": secrets.token_urlsafe()},
    ):
        caplog.clear()
        with caplog.at_level(logging.WARNING):
            seed_users(db_session, _settings(**kw))
        assert "BOOTSTRAP_ADMIN_EMAIL" in caplog.text
        assert "BOOTSTRAP_ADMIN_PASSWORD" in caplog.text
        assert db_session.scalars(select(User)).all() == []


def test_ac014_require_admin_401_403_and_signup_never_admin(client: TestClient) -> None:
    calls: list[int] = []

    @app.get("/_test-admin-only")
    def _probe(_: User = Depends(require_admin)) -> dict:  # noqa: B008
        calls.append(1)
        return {}

    try:
        assert client.get("/_test-admin-only").json() == {"detail": "Not authenticated"}
        bad = client.get("/_test-admin-only", headers={"Authorization": "Bearer nope"})
        assert bad.status_code == 401
        res = client.post(
            "/auth/signup",
            json={
                "email": f"v-{secrets.token_hex(4)}@example.com",
                "password": secrets.token_urlsafe(),
                "role": "admin",
                "is_admin": True,
            },
        )
        assert res.status_code == 201 and res.json()["user"]["role"] == "viewer"
        denied = client.get(
            "/_test-admin-only", headers={"Authorization": f"Bearer {res.json()['token']}"}
        )
        assert denied.status_code == 403
        assert denied.json() == {"detail": "Admin access required"}
        assert calls == []
    finally:
        app.router.routes[:] = [
            r for r in app.router.routes if getattr(r, "path", "") != "/_test-admin-only"
        ]


def test_smoke_viewer_seeded_once_and_not_when_unset(db_session: Session) -> None:
    seed_users(db_session, _settings())
    assert db_session.scalars(select(User)).all() == []
    s = _settings(
        smoke_test_email=f"s-{secrets.token_hex(4)}@example.com",
        smoke_test_password=secrets.token_urlsafe(),
    )
    seed_users(db_session, s)
    seed_users(db_session, s)
    users = db_session.scalars(select(User)).all()
    assert [u.role for u in users] == ["viewer"]
