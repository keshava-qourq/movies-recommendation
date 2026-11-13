"""US-005 acceptance tests: the sample catalog after install.

NFR-010: the sample catalog is not duplicated or removed across restarts (tested by entering
the app lifespan several times). The first admin not being duplicated is covered by the
bootstrap unit test; accounts, likes and uploads surviving restart belong to their own stories.
NFR-013 (English-only): sample text is checked to be Latin script; the UI language is not
testable at API level.
"""

import json
import secrets
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

APP_DIR = Path(__file__).resolve().parents[2] / "app"


def _headers(c: TestClient) -> dict[str, str]:
    email = f"qa-{secrets.token_hex(6)}@example.com"
    resp = c.post("/auth/signup", json={"email": email, "password": secrets.token_urlsafe(12)})
    assert resp.status_code == 201
    return {"Authorization": f"Bearer {resp.json()['token']}"}


def _catalog(c: TestClient, headers: dict[str, str]) -> list[dict]:
    resp = c.get("/movies", params={"limit": 100}, headers=headers)
    assert resp.status_code == 200
    return resp.json()["items"]


def test_ac017_fresh_install_loads_about_50_complete_movies(client: TestClient) -> None:
    with TestClient(app) as c:
        headers = _headers(c)
        items = _catalog(c, headers)
        assert 45 <= len(items) <= 60
        for item in items:
            assert isinstance(item["id"], int)
            detail = c.get(f"/movies/{item['id']}", headers=headers)
            assert detail.status_code == 200
            m = detail.json()
            assert m["title"].strip()
            assert isinstance(m["year"], int)
            assert m["genres"] and all(g.strip() for g in m["genres"])
            assert m["director"].strip()
            assert m["cast"] and all(a.strip() for a in m["cast"])
            assert m["plot"].strip()


def test_ac018_nfr010_restart_does_not_duplicate_or_remove(client: TestClient) -> None:
    with TestClient(app) as c:
        before = _catalog(c, _headers(c))
    assert before
    for _ in range(2):
        with TestClient(app) as c:
            headers = _headers(c)
            after = _catalog(c, headers)
            assert c.get("/movies", headers=headers).json()["total"] == len(before)
            assert [(m["id"], m["title"], m["year"]) for m in after] == [
                (m["id"], m["title"], m["year"]) for m in before
            ]
        keys = [(m["title"].strip().lower(), m["year"]) for m in after]
        assert len(keys) == len(set(keys))


def test_ac019_sample_is_bundled_hand_written_file_not_fetched(client: TestClient) -> None:
    path = APP_DIR / "data" / "sample_movies.json"
    assert path.is_file()
    data = json.loads(path.read_text(encoding="utf-8"))
    assert 45 <= len(data) <= 60
    for name in ("bootstrap.py", "main.py"):
        src = (APP_DIR / name).read_text(encoding="utf-8").lower()
        for banned in ("urllib", "requests", "httpx", "http://", "https://", "aiohttp"):
            assert banned not in src, f"{name} mentions {banned}"
    dumped = json.dumps(data)
    assert "http://" not in dumped and "https://" not in dumped


def test_nfr013_sample_text_is_english_latin(client: TestClient) -> None:
    with TestClient(app) as c:
        headers = _headers(c)
        for item in _catalog(c, headers):
            m = c.get(f"/movies/{item['id']}", headers=headers).json()
            text = " ".join([m["title"], m["director"], m["plot"], *m["genres"], *m["cast"]])
            assert all(ord(ch) < 0x250 for ch in text)
