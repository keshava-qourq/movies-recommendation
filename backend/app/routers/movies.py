"""Signed-in movie feature entry points (NFR-004). Handlers are placeholders until built."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Like, Movie, User
from app.security import utcnow

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


def _find_movie(db: Session, movie_id: str) -> Movie:
    try:
        mid = int(movie_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Movie not found") from None
    m = db.get(Movie, mid) if -(2**63) <= mid < 2**63 else None
    if m is None:
        raise HTTPException(status_code=404, detail="Movie not found")
    return m


@router.get("/movies/{movie_id}")
def movie_detail(movie_id: str, db: Annotated[Session, Depends(get_db)]) -> dict[str, Any]:
    return _movie_out(_find_movie(db, movie_id))


@router.get("/me/for-you")
def for_you() -> dict[str, Any]:
    return {"items": []}


@router.post("/movies/{movie_id}/like")
def like_movie(
    movie_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    m = _find_movie(db, movie_id)
    if db.get(Like, (user.id, m.id)) is None:
        db.add(Like(user_id=user.id, movie_id=m.id, created_at=utcnow()))
        db.commit()
    return _movie_out(m)


@router.delete("/movies/{movie_id}/like", status_code=204)
def unlike_movie(
    movie_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Response:
    m = _find_movie(db, movie_id)
    existing = db.get(Like, (user.id, m.id))
    if existing is not None:
        db.delete(existing)
        db.commit()
    return Response(status_code=204)


@router.get("/me/likes")
def likes(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    rows = db.scalars(
        select(Movie)
        .join(Like, Like.movie_id == Movie.id)
        .where(Like.user_id == user.id)
        .order_by(Like.created_at.desc(), Movie.id.desc())
    ).all()
    return {"items": [_movie_out(m) for m in rows]}
