"""US-012 API checks for similarity on the seeded sample catalog.

AC-039, AC-040 and AC-041 (hand-calculated scores, all four fields, empty fields) are
covered by backend/tests/unit/test_similarity.py. Here the API is checked against the
seeded catalog, with users created through signup: no upload endpoint is used.
"""

import secrets

from fastapi.testclient import TestClient

from app.main import app


def _headers(c: TestClient) -> dict[str, str]:
    email = f"qa-{secrets.token_hex(6)}@example.com"
    resp = c.post("/auth/signup", json={"email": email, "password": secrets.token_urlsafe(12)})
    assert resp.status_code == 201
    return {"Authorization": f"Bearer {resp.json()['token']}"}


def _catalog(c: TestClient, headers: dict[str, str]) -> list[dict]:
    resp = c.get("/movies", params={"limit": 100}, headers=headers)
    assert resp.status_code == 200
    return resp.json()["items"]


def test_ac040_nfr012_scores_in_range_sorted_and_capped() -> None:
    with TestClient(app) as c:
        headers = _headers(c)
        movies = _catalog(c, headers)
        assert movies
        for m in movies:
            resp = c.get(f"/movies/{m['id']}/similar", headers=headers)
            assert resp.status_code == 200
            items = resp.json()["items"]
            assert len(items) <= 10
            assert m["id"] not in [i["id"] for i in items]
            for i in items:
                assert 0 < i["score"] <= 1
            keys = [(-i["score"], i["id"]) for i in items]
            assert keys == sorted(keys)


def test_ac040_nfr012_repeated_calls_give_same_order() -> None:
    with TestClient(app) as c:
        headers = _headers(c)
        mid = _catalog(c, headers)[0]["id"]
        first = c.get(f"/movies/{mid}/similar", headers=headers).json()
        second = c.get(f"/movies/{mid}/similar", headers=headers).json()
        assert first == second


def test_ac039_ac041_every_sample_movie_is_scored_without_error() -> None:
    """Each catalog movie, whichever fields it has filled, gets a 200 and at least one
    result somewhere in the catalog (the movies are scored from their remaining fields)."""
    with TestClient(app) as c:
        headers = _headers(c)
        movies = _catalog(c, headers)
        scored = 0
        for m in movies:
            resp = c.get(f"/movies/{m['id']}/similar", headers=headers)
            assert resp.status_code == 200
            scored += bool(resp.json()["items"])
        assert scored > 0
