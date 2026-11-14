"""US-006 [AC-020][AC-021][AC-022][NFR-009]: no outgoing network calls while the app is used.

Every socket connection made during search, similarity, likes, for-you and upload is recorded;
only the configured database host (and loopback) may appear. AC-021 (browser requests) is
covered statically here and by frontend/e2e/self-contained.spec.ts.
NFR-013 (English only) is covered by the existing English-only checks.
"""

import os
import secrets
import socket
from pathlib import Path
from urllib.parse import urlparse

from fastapi.testclient import TestClient

from app.main import app

ROOT = Path(__file__).resolve().parents[3]


def _allowed_hosts() -> set[str]:
    host = urlparse(os.environ.get("DATABASE_URL", "").replace("+psycopg", "")).hostname
    allowed = {"127.0.0.1", "::1", "localhost"}
    if host:
        allowed.add(host)
        try:
            allowed.update(i[4][0] for i in socket.getaddrinfo(host, None))
        except OSError:
            pass
    return allowed


def test_ac020_ac022_nfr009_features_make_no_outside_connections(monkeypatch) -> None:
    admin_email = f"admin-{secrets.token_hex(4)}@example.com"
    admin_pw = secrets.token_urlsafe(12)
    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", admin_email)
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", admin_pw)
    seen: list[str] = []
    real = socket.socket.connect

    def spy(self, address, *a, **kw):
        if isinstance(address, tuple) and address:
            seen.append(str(address[0]))
        return real(self, address, *a, **kw)

    monkeypatch.setattr(socket.socket, "connect", spy)
    with TestClient(app) as c:
        email = f"qa-{secrets.token_hex(6)}@example.com"
        r = c.post("/auth/signup", json={"email": email, "password": secrets.token_urlsafe(12)})
        assert r.status_code == 201
        h = {"Authorization": f"Bearer {r.json()['token']}"}
        found = c.get("/movies", params={"q": "heat", "limit": 100}, headers=h)
        assert found.status_code == 200
        mid = c.get("/movies", params={"limit": 1}, headers=h).json()["items"][0]["id"]
        assert c.get(f"/movies/{mid}/similar", headers=h).status_code == 200
        assert c.put(f"/movies/{mid}/like", headers=h).status_code == 200
        assert c.get("/me/for-you", headers=h).status_code == 200
        assert c.get("/me/likes", headers=h).status_code == 200
        admin = c.post(
            "/auth/login",
            json={
                "email": os.environ["BOOTSTRAP_ADMIN_EMAIL"],
                "password": os.environ["BOOTSTRAP_ADMIN_PASSWORD"],
            },
        )
        assert admin.status_code == 200
        csv = f"title,year,genres,director,cast,plot\nOff{secrets.token_hex(4)},2001,Drama,D,A,P\n"
        up = c.post(
            "/admin/movies/upload",
            headers={"Authorization": f"Bearer {admin.json()['token']}"},
            files={"file": ("m.csv", csv.encode(), "text/csv")},
        )
        assert up.status_code == 200
    outside = {h for h in seen if h not in _allowed_hosts()}
    assert outside == set()


def test_ac021_index_html_links_only_local_assets() -> None:
    html = (ROOT / "frontend" / "index.html").read_text("utf-8").lower()
    assert "http://" not in html and "https://" not in html
    assert "fonts.googleapis" not in html and "//cdn" not in html
