"""Signed-in movie feature entry points (NFR-004)."""

import threading
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app import similarity
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


_cache_lock = threading.Lock()
_cache: dict[str, Any] = {"key": None, "vectors": {}, "outs": {}}


def _catalog(db: Session) -> tuple[dict[int, similarity.Vector], dict[int, dict[str, Any]]]:
    """Vectorised catalog, rebuilt only when the cheap fingerprint changes."""
    key = tuple(
        db.execute(
            select(func.count(Movie.id), func.max(Movie.id), func.max(Movie.created_at))
        ).one()
    )
    with _cache_lock:
        if _cache["key"] != key:
            movies = list(db.scalars(select(Movie)))
            _cache["vectors"] = similarity.vectorise(movies)
            _cache["outs"] = {m.id: _movie_out(m) for m in movies}
            _cache["key"] = key
        return _cache["vectors"], _cache["outs"]


@router.get("/movies/{movie_id}/similar")
def similar(movie_id: str, db: Annotated[Session, Depends(get_db)]) -> dict[str, Any]:
    target = _find_movie(db, movie_id)
    vectors, outs = _catalog(db)
    ranked = similarity.rank(vectors.get(target.id, {}), vectors, {target.id})
    return {"items": [{**outs[i], "score": s} for i, s in ranked]}


@router.get("/me/for-you")
def for_you(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    liked_ids = set(db.scalars(select(Like.movie_id).where(Like.user_id == user.id)))
    if not liked_ids:
        return {"items": [], "has_likes": False}
    movies = {m.id: m for m in db.scalars(select(Movie))}
    vectors = similarity.vectorise(movies.values())
    profile = similarity.add_vectors(vectors[i] for i in liked_ids if i in vectors)
    ranked = similarity.rank(profile, vectors, liked_ids)
    items = [{**_movie_out(movies[i]), "score": s} for i, s in ranked]
    return {"items": items, "has_likes": True}


@router.put("/movies/{movie_id}/like")
@router.post("/movies/{movie_id}/like", include_in_schema=False)
def like_movie(
    movie_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    m = _find_movie(db, movie_id)
    db.execute(
        insert(Like)
        .values(user_id=user.id, movie_id=m.id, created_at=utcnow())
        .on_conflict_do_nothing(index_elements=["user_id", "movie_id"])
    )
    db.commit()
    return {"movie_id": m.id, "liked": True}


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
