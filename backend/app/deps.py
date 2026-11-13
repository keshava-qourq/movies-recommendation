"""Authentication dependencies: the session behind a Bearer token, and the admin check."""

from datetime import UTC, timedelta
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import security
from app.config import get_settings
from app.database import get_db
from app.models import User, UserSession


def _unauthenticated() -> HTTPException:
    return HTTPException(
        status_code=401, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"}
    )


def get_current_session(
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
) -> UserSession:
    """The live session for the presented token; refreshes last_seen_at. Fails closed."""
    parts = (authorization or "").split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1]:
        raise _unauthenticated()
    session = db.scalar(
        select(UserSession).where(UserSession.token_hash == security.hash_token(parts[1]))
    )
    if session is None or session.revoked_at is not None:
        raise _unauthenticated()
    now = security.utcnow()
    idle = timedelta(minutes=get_settings().session_idle_minutes)
    last_seen = session.last_seen_at
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=UTC)
    if now - last_seen > idle:
        raise _unauthenticated()
    session.last_seen_at = now
    db.commit()
    return session


def get_current_user(
    session: Annotated[UserSession, Depends(get_current_session)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    user = db.get(User, session.user_id)
    if user is None:
        raise _unauthenticated()
    return user


def require_admin(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
