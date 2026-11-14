"""CSV upload row handling, called directly (AC-053, AC-058, AC-059, AC-060, AC-061)."""

import io
import secrets

import pytest
from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.main import app
from app.models import Movie
from app.routers.admin import upload_movies

HEAD = "title,year,genres,director,cast,plot\n"


def _up(db: Session, body: str | bytes):
    raw = body.encode() if isinstance(body, str) else body
    return upload_movies(db, UploadFile(file=io.BytesIO(raw), filename="m.csv"))


def test_ac053_ac058_ac059_ac060_mixed_rows(db_session: Session) -> None:
    t = secrets.token_hex(4)
    _up(db_session, HEAD + f"Old{t},2000,Drama,D,A,Plot\n")
    body = (
        HEAD
        + f"New{t},2001,Drama|Comedy,Dir,A|B,Plot\n"
        + f"new{t},2001,Drama,Dir,A,Plot\n"
        + f"OLD{t},2000,Drama,Dir,A,Plot\n"
        + ",19x2,,,,\n"
        + f"Far{t},3000,,,,Plot\n"
    )
    res = _up(db_session, body)
    assert res["added"] == 1
    assert res["skipped"] == [
        {"row": 2, "title": f"new{t}", "reason": "Duplicate of row 1 in this file"},
        {"row": 3, "title": f"OLD{t}", "reason": "Already in the catalog"},
    ]
    reasons = {r["row"]: r["reason"] for r in res["rejected"]}
    assert reasons[4] == 'Title is empty; Year "19x2" is not a number; Plot is empty'
    assert reasons[5].startswith("Year 3000 is outside 1888-")
    assert all("title" in r for r in res["rejected"])
    movie = db_session.scalar(select(Movie).where(Movie.title == f"New{t}"))
    assert movie.genres == ["Drama", "Comedy"] and movie.cast_members == ["A", "B"]


def test_ac056_bad_header_and_non_utf8_add_nothing(db_session: Session) -> None:
    for body in ("title,year\nX,2000\n", b"\xff\xfe\x00bad"):
        with pytest.raises(HTTPException) as exc:
            _up(db_session, body)
        assert exc.value.status_code == 400 and isinstance(exc.value.detail, str)
    assert db_session.scalars(select(Movie)).all() == []


def test_ac061_no_edit_or_delete_routes() -> None:
    for path, ops in app.openapi()["paths"].items():
        if path.startswith("/movies") or path.startswith("/admin"):
            assert not {"patch", "delete"} & set(ops) or path.endswith("/like")
            assert "put" not in ops or path.endswith("/like")
