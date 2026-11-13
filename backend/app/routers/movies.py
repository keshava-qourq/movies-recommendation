"""Signed-in movie feature entry points (NFR-004). Handlers are placeholders until built."""

from typing import Any

from fastapi import APIRouter, Depends

from app.deps import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/movies")
def list_movies() -> dict[str, Any]:
    return {"items": [], "total": 0}


@router.get("/me/for-you")
def for_you() -> dict[str, Any]:
    return {"items": []}


@router.get("/me/likes")
def likes() -> dict[str, Any]:
    return {"items": []}
