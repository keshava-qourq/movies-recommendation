"""Application entrypoint.

One router per component that owns endpoints (auth, movies). Migrations and seeding
run on startup.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.bootstrap import seed_movies, seed_users
from app.config import get_settings
from app.database import SessionLocal
from app.migrations.runner import upgrade_to_head
from app.routers import auth, movies


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup: run migrations, then seed the configured users (idempotent).

    This runs on startup and not at import, so importing the application never opens a
    connection and a test can point `get_db` at a database of its own.
    """
    upgrade_to_head()
    with SessionLocal() as db:
        seed_users(db)
        seed_movies(db)
    yield


app = FastAPI(
    title="Movies recommendation",
    description=(
        "WatchNext: search for a movie you liked and get similar movies, ranked by cosine "
        "similarity on plot, genres, director and cast. Like movies to get a For you list. "
        "Fully self-contained: no outside services at build time or run time."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# The SPA runs on a different origin than the API. Only that origin is allowed (set by
# ALLOWED_ORIGINS when deployed). Sessions travel as a Bearer header, never a cookie, so
# credentials are not allowed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


app.include_router(auth.router)
app.include_router(movies.router)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}
