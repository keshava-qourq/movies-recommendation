"""Password hashing, session tokens and the clock shared by signup, login and the seed."""

import hashlib
import secrets
from datetime import UTC, datetime

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

_hasher = PasswordHasher()
_DUMMY_HASH = _hasher.hash("dummy-password-for-timing")


def utcnow() -> datetime:
    """The one clock every session check uses, so tests can monkeypatch it."""
    return datetime.now(UTC)


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerificationError, InvalidHashError):
        return False


def verify_dummy() -> None:
    """Spend the same time as a real check when the email is unknown."""
    verify_password(_DUMMY_HASH, "not-the-password")


def new_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def normalize_email(email: str) -> str:
    return email.strip().lower()
