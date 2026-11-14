"""Admin-only CSV movie upload."""

import csv
import io
from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models import Movie

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
REQUIRED = ["title", "year", "genres", "director", "cast", "plot"]


def _split(value: str) -> list[str]:
    return [p.strip() for p in value.split("|") if p.strip()]


@router.post("/movies/upload")
def upload_movies(
    db: Annotated[Session, Depends(get_db)], file: Annotated[UploadFile, File()]
) -> dict[str, Any]:
    raw = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File is too large")
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 CSV") from None
    reader = csv.DictReader(io.StringIO(text))
    try:
        header = [(h or "").strip().lower() for h in reader.fieldnames or []]
    except csv.Error:
        raise HTTPException(status_code=400, detail="File is not a valid CSV") from None
    missing = [c for c in REQUIRED if c not in header]
    if missing:
        raise HTTPException(
            status_code=400, detail="Missing required columns: " + ", ".join(missing)
        )
    reader.fieldnames = header
    max_year = datetime.now(UTC).year + 5
    existing = set(db.execute(select(Movie.title_key, Movie.year)).all())
    added = 0
    skipped: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    try:
        for row_no, row in enumerate(reader, start=1):
            title = (row.get("title") or "").strip()
            try:
                year = int((row.get("year") or "").strip())
            except ValueError:
                year = 0
            director = (row.get("director") or "").strip()
            plot = (row.get("plot") or "").strip()
            if not title or not plot or not 1888 <= year <= max_year:
                rejected.append(
                    {"row": row_no, "reason": "Title, plot and a valid year are required"}
                )
                continue
            if len(title) > 300 or len(director) > 200:
                rejected.append({"row": row_no, "reason": "Title or director is too long"})
                continue
            key = (title.lower(), year)
            if key in existing:
                skipped.append({"row": row_no, "reason": "Duplicate title and year"})
                continue
            existing.add(key)
            db.add(
                Movie(
                    title=title,
                    title_key=key[0],
                    year=year,
                    genres=_split(row.get("genres") or ""),
                    director=director,
                    cast_members=_split(row.get("cast") or ""),
                    plot=plot,
                )
            )
            added += 1
    except csv.Error:
        db.rollback()
        raise HTTPException(status_code=400, detail="File is not a valid CSV") from None
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Upload conflicted; please retry") from None
    return {"added": added, "skipped": skipped, "rejected": rejected}
