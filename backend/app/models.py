"""SQLAlchemy models, matching the approved data model.

Any change here needs a matching Alembic migration in `app/migrations/versions`.
"""

from datetime import UTC, datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import TypeDecorator

from app.database import Base


class UTCDateTime(TypeDecorator):
    """timestamptz that always comes back timezone-aware."""

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_result_value(self, value, dialect):
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role in ('viewer','admin')", name="ck_users_role"),)

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    # Stored lowercased, so uniqueness holds in any letter case.
    email: Mapped[str] = mapped_column(String(320), unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), server_default=func.now())


class UserSession(Base):
    """A server-side session; only the sha256 of the opaque token is stored."""

    __tablename__ = "sessions"
    __table_args__ = (Index("ix_sessions_user_id", "user_id"),)

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(UTCDateTime(), server_default=func.now())
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)


class Movie(Base):
    __tablename__ = "movies"
    __table_args__ = (UniqueConstraint("title_key", "year", name="uq_movies_title_key_year"),)

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    # Lowercased, trimmed title; unique together with year.
    title_key: Mapped[str] = mapped_column(String(300))
    year: Mapped[int] = mapped_column(SmallInteger)
    genres: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'"))
    director: Mapped[str] = mapped_column(String(200), server_default="")
    cast_members: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'"))
    plot: Mapped[str] = mapped_column(Text, server_default="")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), server_default=func.now())


class Like(Base):
    __tablename__ = "likes"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    movie_id: Mapped[int] = mapped_column(
        ForeignKey("movies.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), server_default=func.now())
