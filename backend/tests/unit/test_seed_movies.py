"""Sample catalog seeding: data file, idempotence, no network."""

import json
import secrets
import socket

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.bootstrap import SAMPLE_MOVIES_PATH, seed_movies
from app.main import app
from app.models import Movie, User


def test_ac017_ac019_file_exists_and_has_required_fields() -> None:
    assert SAMPLE_MOVIES_PATH.is_file()
    data = json.loads(SAMPLE_MOVIES_PATH.read_text(encoding="utf-8"))
    assert 48 <= len(data) <= 55
    for e in data:
        assert e["title"].strip() and isinstance(e["year"], int)
        assert e["genres"] and e["cast"] and e["director"]
        assert 1 <= e["plot"].count(". ") + 1 <= 3
    keys = {(e["title"].strip().lower(), e["year"]) for e in data}
    assert len(keys) == len(data)


def test_ac017_empty_database_loads_sample(db_session: Session) -> None:
    added = seed_movies(db_session)
    count = db_session.scalar(select(func.count()).select_from(Movie))
    assert added == count and 48 <= count <= 55


def test_ac018_rerun_keeps_admin_added_movies_and_adds_no_duplicates(db_session: Session) -> None:
    seed_movies(db_session)
    db_session.add(Movie(title="  My Own Film ", title_key="my own film", year=2024))
    db_session.commit()
    before = db_session.scalar(select(func.count()).select_from(Movie))
    assert seed_movies(db_session) == 0
    assert db_session.scalar(select(func.count()).select_from(Movie)) == before


def test_ac019_seed_opens_no_sockets(db_session: Session, monkeypatch) -> None:
    def boom(*a, **k):
        raise AssertionError("network used")

    monkeypatch.setattr(socket.socket, "connect", boom)
    seed_movies(db_session)


def test_nfr010_three_startups_leave_one_of_each(db_session: Session, monkeypatch) -> None:
    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", "boot-admin@example.com")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", secrets.token_urlsafe())
    for _ in range(3):
        with TestClient(app):
            pass
    db_session.expire_all()
    movies = db_session.scalar(select(func.count()).select_from(Movie))
    admins = db_session.scalar(select(func.count()).select_from(User).where(User.role == "admin"))
    assert 48 <= movies <= 55
    assert admins == 1
    distinct = db_session.scalar(
        select(func.count()).select_from(select(Movie.title_key, Movie.year).distinct().subquery())
    )
    assert distinct == movies
