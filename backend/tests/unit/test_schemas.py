"""Signup validates email format; login treats it as a plain string."""

import pytest
from pydantic import ValidationError

from app.schemas import Credentials, SignupRequest


def test_ac003_login_accepts_malformed_email_and_signup_rejects() -> None:
    assert Credentials(email=" not-an-email ", password="x").email == "not-an-email"
    with pytest.raises(ValidationError):
        SignupRequest(email="not-an-email", password="longenough")
