"""Initial schema: users, sessions, movies, likes.

Revision ID: 0001
Revises:
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

BigInt = sa.BigInteger().with_variant(sa.Integer(), "sqlite")


def upgrade() -> None:
    pg = op.get_bind().dialect.name == "postgresql"
    empty_list = sa.text("'{}'") if pg else sa.text("'[]'")
    text_list = postgresql.ARRAY(sa.Text()).with_variant(sa.JSON(), "sqlite")
    op.create_table(
        "users",
        sa.Column("id", BigInt, sa.Identity(always=True), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("role", sa.String(10), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("email", name="uq_users_email"),
        sa.CheckConstraint("role in ('viewer','admin')", name="ck_users_role"),
    )
    op.create_table(
        "sessions",
        sa.Column("id", BigInt, sa.Identity(always=True), primary_key=True),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column(
            "user_id",
            BigInt,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("token_hash", name="uq_sessions_token_hash"),
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"])
    op.create_table(
        "movies",
        sa.Column("id", BigInt, sa.Identity(always=True), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("title_key", sa.String(300), nullable=False),
        sa.Column("year", sa.SmallInteger(), nullable=False),
        sa.Column("genres", text_list, server_default=empty_list, nullable=False),
        sa.Column("director", sa.String(200), server_default="", nullable=False),
        sa.Column(
            "cast_members",
            text_list,
            server_default=empty_list,
            nullable=False,
        ),
        sa.Column("plot", sa.Text(), server_default="", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("title_key", "year", name="uq_movies_title_key_year"),
    )
    op.create_table(
        "likes",
        sa.Column(
            "user_id",
            BigInt,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "movie_id",
            BigInt,
            sa.ForeignKey("movies.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_table("likes")
    op.drop_table("movies")
    op.drop_index("ix_sessions_user_id", table_name="sessions")
    op.drop_table("sessions")
    op.drop_table("users")
