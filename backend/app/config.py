"""Settings read from the environment, each with a working local default.

Read at call time (not import) so a test can set a variable and see it take effect.
"""

import os
from dataclasses import dataclass

_DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]


def _optional(name: str) -> str | None:
    value = os.getenv(name, "").strip()
    return value or None


def _int(name: str, default: int) -> int:
    try:
        value = int(os.getenv(name, "").strip() or default)
    except ValueError:
        return default
    return value if value > 0 else default


@dataclass(frozen=True)
class Settings:
    # The SPA's origin(s) for CORS, comma separated.
    allowed_origins: list[str]
    # The shared API bearer the generated frontend sends. Public: never sign anything with it.
    secret_key: str
    # First admin, created on startup when both are set.
    bootstrap_admin_email: str | None
    bootstrap_admin_password: str | None
    # One normal (viewer) user for smoke tests, created on startup when both are set.
    smoke_test_email: str | None
    smoke_test_password: str | None
    # Minutes without an authenticated request before a session expires.
    session_idle_minutes: int = 30


def get_settings() -> Settings:
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "").strip() or os.getenv("ALLOWED_ORIGINS", "")
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return Settings(
        allowed_origins=origins or list(_DEV_ORIGINS),
        secret_key=os.getenv("SECRET_KEY", "local-dev-shared-bearer"),
        bootstrap_admin_email=_optional("BOOTSTRAP_ADMIN_EMAIL"),
        bootstrap_admin_password=_optional("BOOTSTRAP_ADMIN_PASSWORD"),
        smoke_test_email=_optional("SMOKE_TEST_EMAIL"),
        smoke_test_password=_optional("SMOKE_TEST_PASSWORD"),
        session_idle_minutes=_int("SESSION_IDLE_MINUTES", 30),
    )
