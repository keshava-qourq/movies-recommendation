"""Hashing, token and email helpers."""

import re

from app.security import (
    hash_password,
    hash_token,
    new_token,
    normalize_email,
    utcnow,
    verify_password,
)


def test_ac005_password_hash_is_salted_argon2() -> None:
    a, b = hash_password("password-1"), hash_password("password-1")
    assert a.startswith("$argon2") and a != b
    assert verify_password(a, "password-1")
    assert not verify_password(a, "Password-1")


def test_session_token_is_long_and_hashed_sha256() -> None:
    token = new_token()
    assert len(token) >= 43 and token != new_token()
    assert re.fullmatch(r"[0-9a-f]{64}", hash_token(token))
    assert hash_token(token) != token


def test_ac002_email_normalisation_trims_and_lowercases() -> None:
    assert normalize_email("  A@B.Com ") == "a@b.com"


def test_utcnow_is_timezone_aware() -> None:
    assert utcnow().utcoffset().total_seconds() == 0
