"""US-012 [AC-039][AC-040][AC-041][NFR-012]: hand-calculated scores through the API.

Movies are uploaded by the seeded admin with run-unique words, so only they share terms.
NFR-009 (no outside services) and NFR-013 (English only) are covered by earlier specs
and the docs/sample-text checks; no extra test is needed here.
"""

import math
import os
import secrets

from fastapi.testclient import TestClient

from app.main import app


def _login(c: TestClient, email: str, password: str) -> dict[str, str]:
    r = c.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_ac039_ac040_ac041_nfr012_hand_calculated_scores_via_upload(monkeypatch) -> None:
    r = secrets.token_hex(4)
    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", f"admin-{r}@example.com")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", secrets.token_urlsafe(12))
    a_w, b_w, c_w = f"alpha{r}", f"beta{r}", f"gamma{r}"
    g, d, cs = f"genre{r}", f"dir{r}", f"cast{r}"
    rows = [
        ("A", f"{a_w} {b_w}", g, d, cs),
        ("B", f"{a_w} {c_w}", g, d, cs),
        ("C", a_w, "", "", ""),  # empty genres, director, cast: AC-041
    ]
    csv_text = "title,year,genres,director,cast,plot\n" + "".join(
        f"Sim{t}{r},2001,{gn},{di},{ca},{pl}\n" for t, pl, gn, di, ca in rows
    )
    with TestClient(app) as c:
        admin = _login(
            c, os.environ["BOOTSTRAP_ADMIN_EMAIL"], os.environ["BOOTSTRAP_ADMIN_PASSWORD"]
        )
        up = c.post(
            "/admin/movies/upload",
            headers=admin,
            files={"file": ("m.csv", csv_text.encode(), "text/csv")},
        )
        assert up.status_code == 200
        listing = c.get("/movies", params={"q": r, "limit": 100}, headers=admin).json()
        ids = {m["title"]: m["id"] for m in listing["items"]}
        assert len(ids) == 3
        n = c.get("/movies", params={"limit": 1}, headers=admin).json()["total"]

        def idf(df: int) -> float:
            return math.log((1 + n) / (1 + df)) + 1

        # A = {a:2, b:1, g:3, d:2, c:2 (df)}; B = {a, c_w, g, d, c}
        va = {"a": idf(3), "b": idf(1), "g": idf(2), "d": idf(2), "c": idf(2)}
        vb = {"a": idf(3), "x": idf(1), "g": idf(2), "d": idf(2), "c": idf(2)}
        vc = {"a": idf(3)}

        def cos(u: dict, v: dict) -> float:
            dot = sum(w * v[k] for k, w in u.items() if k in v)
            return dot / (math.sqrt(sum(w * w for w in u.values()))
                          * math.sqrt(sum(w * w for w in v.values())))

        resp = c.get(f"/movies/{ids['Sim' + 'A' + r]}/similar", headers=admin)
        assert resp.status_code == 200
        items = resp.json()["items"]
        scores = {i["id"]: i["score"] for i in items}
        assert abs(scores[ids[f"SimB{r}"]] - cos(va, vb)) < 1e-4
        # C has no genres, director or cast but still gets scored from its other fields
        assert abs(scores[ids[f"SimC{r}"]] - cos(va, vc)) < 1e-4
        for s in scores.values():
            assert 0 < s <= 1
        keys = [(-i["score"], i["id"]) for i in items]
        assert keys == sorted(keys)
        # the empty-plot movie's own page works too
        own = c.get(f"/movies/{ids[f'SimC{r}']}/similar", headers=admin)
        assert own.status_code == 200
