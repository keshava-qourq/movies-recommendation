"""Admin-only CSV movie upload."""

import csv
import io
from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
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
    seen: dict[tuple[str, int], int] = {}
    added = 0
    skipped: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    try:
        for row_no, row in enumerate(reader, start=1):
            title = (row.get("title") or "").strip()
            raw_year = (row.get("year") or "").strip()
            director = (row.get("director") or "").strip()
            plot = (row.get("plot") or "").strip()
            problems: list[str] = []
            if not title:
                problems.append("Title is empty")
            elif len(title) > 300:
                problems.append("Title is longer than 300 characters")
            year = 0
            try:
                year = int(raw_year)
                if not 1888 <= year <= max_year:
                    problems.append(f"Year {year} is outside 1888-{max_year}")
            except ValueError:
                problems.append(
                    "Year is empty" if not raw_year else f'Year "{raw_year}" is not a number'
                )
            if not plot:
                problems.append("Plot is empty")
            if len(director) > 200:
                problems.append("Director is longer than 200 characters")
            if problems:
                rejected.append({"row": row_no, "title": title, "reason": "; ".join(problems)})
                continue
            key = (title.lower(), year)
            if key in seen:
                skipped.append(
                    {
                        "row": row_no,
                        "title": title,
                        "reason": f"Duplicate of row {seen[key]} in this file",
                    }
                )
                continue
            seen[key] = row_no
            if key in existing:
                skipped.append({"row": row_no, "title": title, "reason": "Already in the catalog"})
                continue
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
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Upload conflicted; please retry") from None
    return {"added": added, "skipped": skipped, "rejected": rejected}
