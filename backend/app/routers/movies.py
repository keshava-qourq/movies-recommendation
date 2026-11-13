"""Signed-in movie feature entry points (NFR-004)."""

import math
import re
from collections import Counter
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
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


def _features(m: Movie) -> Counter[str]:
    feats: Counter[str] = Counter()
    for g in m.genres:
        feats["g:" + g.lower()] += 1
    if m.director:
        feats["d:" + m.director.lower()] += 1
    for c in m.cast_members:
        feats["c:" + c.lower()] += 1
    for w in re.findall(r"[a-z0-9]+", m.plot.lower()):
        if len(w) > 3:
            feats["p:" + w] += 1
    return feats


def _cosine(a: Counter[str], b: Counter[str]) -> float:
    dot = sum(v * b[k] for k, v in a.items() if k in b)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0


@router.get("/me/for-you")
def for_you(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    liked = db.scalars(
        select(Movie).join(Like, Like.movie_id == Movie.id).where(Like.user_id == user.id)
    ).all()
    if not liked:
        return {"items": [], "has_likes": False}
    profile: Counter[str] = Counter()
    for m in liked:
        profile.update(_features(m))
    liked_ids = {m.id for m in liked}
    scored = []
    for m in db.scalars(select(Movie).where(Movie.id.not_in(liked_ids))):
        score = round(_cosine(profile, _features(m)), 6)
        if score > 0:
            scored.append((score, m))
    scored.sort(key=lambda t: (-t[0], t[1].id))
    items = [{**_movie_out(m), "score": s} for s, m in scored[:10]]
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
