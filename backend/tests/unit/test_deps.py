"""Session dependency logic, called directly."""

import secrets
from datetime import timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import deps, security
from app.models import User, UserSession


def _make(db: Session, role: str = "viewer") -> tuple[User, str]:
    user = User(email=f"{secrets.token_hex(5)}@example.com", password_hash="x", role=role)
    db.add(user)
    db.commit()
    token = security.new_token()
    now = security.utcnow()
    db.add(UserSession(user_id=user.id, token_hash=security.hash_token(token), last_seen_at=now))
    db.commit()
    return user, token


def test_ac010_bad_headers_are_401_with_challenge(db_session: Session) -> None:
    for header in (None, "", "Basic abc", "Bearer", "garbage", "Bearer " + secrets.token_hex(8)):
        with pytest.raises(HTTPException) as exc:
            deps.get_current_session(db_session, header)
        assert exc.value.status_code == 401
        assert exc.value.headers == {"WWW-Authenticate": "Bearer"}


def test_ac009_idle_boundary_and_refresh(db_session: Session, monkeypatch) -> None:
    _, token = _make(db_session)
    start = security.utcnow()
    monkeypatch.setattr(security, "utcnow", lambda: start + timedelta(minutes=29))
    session = deps.get_current_session(db_session, f"Bearer {token}")
    assert session.last_seen_at == start + timedelta(minutes=29)
    monkeypatch.setattr(security, "utcnow", lambda: start + timedelta(minutes=29 + 31))
    with pytest.raises(HTTPException):
        deps.get_current_session(db_session, f"Bearer {token}")


def test_ac008_revoked_session_is_401(db_session: Session) -> None:
    _, token = _make(db_session)
    session = deps.get_current_session(db_session, f"Bearer {token}")
    session.revoked_at = security.utcnow()
    db_session.commit()
    with pytest.raises(HTTPException):
        deps.get_current_session(db_session, f"Bearer {token}")


def test_nfr005_require_admin_refuses_viewer(db_session: Session) -> None:
    viewer, _ = _make(db_session)
    admin, _ = _make(db_session, "admin")
    assert deps.require_admin(admin) is admin
    with pytest.raises(HTTPException) as exc:
        deps.require_admin(viewer)
    assert exc.value.status_code == 403
    assert exc.value.detail == "Admin access required"
