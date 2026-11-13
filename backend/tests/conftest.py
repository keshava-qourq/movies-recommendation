"""Test fixtures: the real PostgreSQL `DATABASE_URL` names, migrated once, emptied per test.

The schema is built by running the Alembic migrations (the only way the schema changes),
once per test session. Every test then starts from empty tables.
"""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, get_db
from app.main import app
from app.migrations.runner import upgrade_to_head


@pytest.fixture(scope="session", autouse=True)
def _migrated() -> None:
    upgrade_to_head()


@pytest.fixture
def db_session(_migrated: None) -> Iterator[Session]:
    """A session on an emptied database."""
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE likes, sessions, movies, users RESTART IDENTITY CASCADE"))
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session: Session) -> Iterator[TestClient]:
    """The application, talking to this test's database."""

    def _get_db() -> Iterator[Session]:
        yield db_session

    app.dependency_overrides[get_db] = _get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
