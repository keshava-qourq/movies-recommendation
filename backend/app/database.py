"""Engine, session factory and the request-scoped session dependency.

`DATABASE_URL` is a SQLAlchemy URL (postgresql+psycopg://...) and wins when set. With it
unset the app uses an embedded SQLite file `app.db` under `DATA_DIR` (default ./data), so
it needs no other service. The schema changes only through Alembic migrations
(see `app/migrations`), never through `create_all`.
"""

import os
from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


def _database_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        return url
    data_dir = Path(os.getenv("DATA_DIR", "").strip() or "./data")
    data_dir.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{(data_dir / 'app.db').resolve()}"


DATABASE_URL = _database_url()

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Declarative base that every model inherits."""


def get_db() -> Iterator[Session]:
    """One session per request, closed even when the handler raises."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
