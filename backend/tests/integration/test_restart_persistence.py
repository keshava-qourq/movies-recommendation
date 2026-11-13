"""US-007 acceptance tests: one app, embedded database, data survives restarts.

A restart is simulated by leaving and re-entering the app lifespan (TestClient context).
Uploaded-movie persistence needs the admin upload endpoint, whose path is not in the
rules; it is not tested here. NFR-011/NFR-013 documentation checks read the README.
"""

import secrets
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

ROOT = Path(__file__).resolve().parents[3]


def _creds() -> tuple[str, str]:
    return f"qa-{secrets.token_hex(6)}@example.com", secrets.token_urlsafe(12)


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_ac024_accounts_and_sample_movies_survive_restart(client: TestClient) -> None:
    email, password = _creds()
    with TestClient(app) as c:
        resp = c.post("/auth/signup", json={"email": email, "password": password})
        assert resp.status_code == 201
        user_id = resp.json()["user"]["id"]
        token = resp.json()["token"]
        listing = c.get("/movies", params={"limit": 1}, headers=_auth(token))
        movie_id = listing.json()["items"][0]["id"]
        total = listing.json()["total"]
    with TestClient(app) as c:
        login = c.post("/auth/login", json={"email": email, "password": password})
        assert login.status_code == 200
        assert login.json()["user"]["id"] == user_id
        after = c.get("/movies", params={"limit": 1}, headers=_auth(login.json()["token"]))
        assert after.json()["items"][0]["id"] == movie_id
        assert after.json()["total"] == total


def test_ac024_nfr010_first_admin_and_catalog_not_duplicated(
    client: TestClient, monkeypatch
) -> None:
    admin = {
        "email": f"admin-{secrets.token_hex(4)}@example.com",
        "password": secrets.token_urlsafe(12),
    }
    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", admin["email"])
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", admin["password"])
    totals = []
    admin_ids = []
    for _ in range(3):
        with TestClient(app) as c:
            login = c.post("/auth/login", json=admin)
            assert login.status_code == 200
            assert login.json()["user"]["role"] == "admin"
            admin_ids.append(login.json()["user"]["id"])
            totals.append(c.get("/movies", headers=_auth(login.json()["token"])).json()["total"])
    assert len(set(admin_ids)) == 1
    assert len(set(totals)) == 1 and totals[0] > 0


def test_ac023_nfr011_no_extra_service_in_compose_or_docs() -> None:
    """The setup docs exist and cover the required topics; no cache/queue/search service."""
    readme = (ROOT / "README.md").read_text(encoding="utf-8").lower()
    for topic in ("install", "start"):
        assert topic in readme, topic
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8").lower()
    for banned in ("redis", "meilisearch", "rabbitmq", "kafka", "elasticsearch"):
        assert banned not in compose, banned


def test_nfr013_documentation_is_english_latin() -> None:
    text = (ROOT / "README.md").read_text(encoding="utf-8")
    assert all(ord(ch) < 0x250 or ch in "–—‘’“”…•→✓" for ch in text)
