"""Signup and login: each creates a new opaque session and returns its token once."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import security
from app.database import get_db
from app.deps import get_current_session, get_current_user
from app.models import User, UserSession
from app.schemas import AuthResponse, Credentials, SignupRequest, UserOut
from app.security import (
    hash_password,
    hash_token,
    new_token,
    normalize_email,
    utcnow,
    verify_dummy,
    verify_password,
)

DB = Annotated[Session, Depends(get_db)]
router = APIRouter(prefix="/auth", tags=["auth"])


def _issue(db: Session, user: User) -> AuthResponse:
    token = new_token()
    now = utcnow()
    db.add(
        UserSession(user_id=user.id, token_hash=hash_token(token), created_at=now, last_seen_at=now)
    )
    db.commit()
    return AuthResponse(token=token, user=UserOut(id=user.id, email=user.email, role=user.role))


@router.post("/logout", status_code=204)
def logout(session: Annotated[UserSession, Depends(get_current_session)], db: DB) -> Response:
    session.revoked_at = security.utcnow()
    db.commit()
    return Response(status_code=204)


@router.get("/me", response_model=UserOut)
def me(user: Annotated[User, Depends(get_current_user)]) -> UserOut:
    return UserOut(id=user.id, email=user.email, role=user.role)


@router.post("/signup", status_code=201, response_model=AuthResponse)
def signup(body: SignupRequest, db: DB) -> AuthResponse:
    email = normalize_email(body.email)
    conflict = HTTPException(status_code=409, detail="Email already registered")
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise conflict
    user = User(email=email, password_hash=hash_password(body.password), role="viewer")
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise conflict from None
    return _issue(db, user)


@router.post("/login", response_model=AuthResponse)
def login(body: Credentials, db: DB) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == normalize_email(body.email)))
    if user is None:
        verify_dummy()
        ok = False
    else:
        ok = verify_password(user.password_hash, body.password)
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _issue(db, user)
