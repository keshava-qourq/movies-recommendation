"""Signed-in movie feature entry points (NFR-004). Handlers are placeholders until built."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Movie

router = APIRouter(dependencies=[Depends(get_current_user)])


def _movie_out(m: Movie) -> dict[str, Any]:
    return {
        "id": m.id,
        "title": m.title,
        "year": m.year,
        "genres": list(m.genres),
        "director": m.director,
        "cast": list(m.cast_members),
        "plot": m.plot,
    }


@router.get("/movies")
def list_movies(
    db: Annotated[Session, Depends(get_db)],
    q: str = "",
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> dict[str, Any]:
    stmt = select(Movie)
    needle = q.strip().lower()
    if needle:
        escaped = needle.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        stmt = stmt.where(func.lower(Movie.title).like(f"%{escaped}%", escape="\\"))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(func.lower(Movie.title), Movie.id).limit(limit).offset(offset)
    ).all()
    return {"items": [_movie_out(m) for m in rows], "total": total}


@router.get("/movies/{movie_id}")
def movie_detail(movie_id: str, db: Annotated[Session, Depends(get_db)]) -> dict[str, Any]:
    try:
        mid = int(movie_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Movie not found") from None
    m = db.get(Movie, mid) if -(2**63) <= mid < 2**63 else None
    if m is None:
        raise HTTPException(status_code=404, detail="Movie not found")
    return _movie_out(m)


@router.get("/me/for-you")
def for_you() -> dict[str, Any]:
    return {"items": []}


@router.get("/me/likes")
def likes() -> dict[str, Any]:
    return {"items": []}
