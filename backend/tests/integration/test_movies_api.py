"""Movie, like, For you and admin upload endpoints, through the API against PostgreSQL."""

import secrets

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Movie, User
from app.security import hash_password

HEAD = "title,year,genres,director,cast,plot\n"


def _viewer(client: TestClient) -> dict[str, str]:
    r = client.post(
        "/auth/signup",
        json={
            "email": f"v-{secrets.token_hex(5)}@example.com",
            "password": secrets.token_urlsafe(12),
        },
    )
    assert r.status_code == 201
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _admin(client: TestClient, db: Session) -> dict[str, str]:
    email, pw = f"a-{secrets.token_hex(5)}@example.com", secrets.token_urlsafe(12)
    db.add(User(email=email, password_hash=hash_password(pw), role="admin"))
    db.commit()
    r = client.post("/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _movie(db: Session, title: str, plot: str, genres=("Drama",), director="", cast=()) -> int:
    m = Movie(
        title=title,
        title_key=title.lower(),
        year=2000,
        genres=list(genres),
        director=director,
        cast_members=list(cast),
        plot=plot,
    )
    db.add(m)
    db.commit()
    return m.id


def _catalog(db: Session) -> dict[str, int]:
    t = secrets.token_hex(3)
    return {
        "a": _movie(db, f"Alpha {t}", f"zebra{t} comet{t}", ("Sci-Fi",), f"dir{t}", (f"c{t}",)),
        "b": _movie(db, f"Bravo {t}", f"zebra{t} comet{t}", ("Sci-Fi",), f"dir{t}", (f"c{t}",)),
        "c": _movie(db, f"Charlie {t}", f"zebra{t}", ("Sci-Fi",)),
        "z": _movie(db, f"Zulu {t}", f"unrelated{t}", ("Western",)),
    }


def _upload(client: TestClient, headers, body: str | bytes, name: str = "m.csv"):
    data = body.encode() if isinstance(body, str) else body
    return client.post(
        "/admin/movies/upload", headers=headers, files={"file": (name, data, "text/csv")}
    )


def test_movie_endpoints_require_a_session(client: TestClient, db_session: Session) -> None:
    ids = _catalog(db_session)
    for method, path in [
        ("get", "/movies"),
        ("get", f"/movies/{ids['a']}"),
        ("get", f"/movies/{ids['a']}/similar"),
        ("put", f"/movies/{ids['a']}/like"),
        ("delete", f"/movies/{ids['a']}/like"),
        ("get", "/me/likes"),
        ("get", "/me/for-you"),
    ]:
        assert getattr(client, method)(path).status_code == 401, path
    assert client.post("/admin/movies/upload").status_code == 401


def test_search_is_case_insensitive_paginated_and_literal(
    client: TestClient, db_session: Session
) -> None:
    h = _viewer(client)
    t = secrets.token_hex(3)
    for n in ("b", "a", "c"):
        _movie(db_session, f"Pg{n.upper()} {t}", "plot")
    _movie(db_session, f"100% Real {t}", "plot")
    _movie(db_session, f"100 Fake {t}", "plot")

    res = client.get("/movies", params={"q": "PG"}, headers=h).json()
    assert res["total"] == 3
    assert [i["title"] for i in res["items"]] == [f"PgA {t}", f"PgB {t}", f"PgC {t}"]
    assert {"id", "title", "year", "liked"} <= set(res["items"][0])

    page = client.get("/movies", params={"q": "pg", "limit": 1, "offset": 1}, headers=h).json()
    assert page["total"] == 3 and [i["title"] for i in page["items"]] == [f"PgB {t}"]

    # % is a literal, not a wildcard
    pct = client.get("/movies", params={"q": "100%"}, headers=h).json()
    assert [i["title"] for i in pct["items"]] == [f"100% Real {t}"]

    none = client.get("/movies", params={"q": "nomatch" + t}, headers=h)
    assert none.status_code == 200 and none.json() == {"items": [], "total": 0}

    assert client.get("/movies", params={"limit": 0}, headers=h).status_code == 422
    assert client.get("/movies", params={"offset": -1}, headers=h).status_code == 422


def test_empty_query_lists_whole_catalog_alphabetically(
    client: TestClient, db_session: Session
) -> None:
    h = _viewer(client)
    ids = _catalog(db_session)
    res = client.get("/movies", headers=h).json()
    assert res["total"] == len(ids)
    titles = [i["title"].lower() for i in res["items"]]
    assert titles == sorted(titles)


def test_movie_detail_and_not_found(client: TestClient, db_session: Session) -> None:
    h = _viewer(client)
    ids = _catalog(db_session)
    d = client.get(f"/movies/{ids['a']}", headers=h)
    assert d.status_code == 200
    body = d.json()
    assert body["id"] == ids["a"] and body["liked"] is False
    assert body["genres"] == ["Sci-Fi"] and len(body["cast"]) == 1 and body["plot"]
    for bad in ("999999", "abc", "99999999999999999999999"):
        assert client.get(f"/movies/{bad}", headers=h).status_code == 404
        assert client.get(f"/movies/{bad}/similar", headers=h).status_code == 404
        assert client.put(f"/movies/{bad}/like", headers=h).status_code == 404
        assert client.delete(f"/movies/{bad}/like", headers=h).status_code == 404


def test_like_and_unlike_are_idempotent_and_per_user(
    client: TestClient, db_session: Session
) -> None:
    h1, h2 = _viewer(client), _viewer(client)
    ids = _catalog(db_session)
    mid = ids["a"]
    for _ in range(2):
        r = client.put(f"/movies/{mid}/like", headers=h1)
        assert r.status_code == 200 and r.json() == {"movie_id": mid, "liked": True}
    likes = client.get("/me/likes", headers=h1).json()["items"]
    assert [m["id"] for m in likes] == [mid]
    assert client.get("/me/likes", headers=h2).json() == {"items": []}
    assert client.get(f"/movies/{mid}", headers=h1).json()["liked"] is True
    assert client.get(f"/movies/{mid}", headers=h2).json()["liked"] is False
    listed = {i["id"]: i["liked"] for i in client.get("/movies", headers=h1).json()["items"]}
    assert listed[mid] is True and listed[ids["b"]] is False

    for _ in range(2):
        r = client.delete(f"/movies/{mid}/like", headers=h1)
        assert r.status_code == 200 and r.json() == {"movie_id": mid, "liked": False}
    assert client.get("/me/likes", headers=h1).json() == {"items": []}
    # unliking something never liked is still a success
    assert client.delete(f"/movies/{ids['z']}/like", headers=h2).status_code == 200


def test_similar_ranks_best_first_excludes_self_and_honours_limit(
    client: TestClient, db_session: Session
) -> None:
    h = _viewer(client)
    ids = _catalog(db_session)
    url = f"/movies/{ids['a']}/similar"
    res = client.get(url, headers=h)
    assert res.status_code == 200
    items = res.json()["items"]
    got = [i["id"] for i in items]
    assert ids["a"] not in got
    assert got[:2] == [ids["b"], ids["c"]]
    assert ids["z"] not in got
    scores = [i["score"] for i in items]
    assert scores == sorted(scores, reverse=True) and all(0 < s <= 1 for s in scores)
    one = client.get(url, params={"limit": 1}, headers=h).json()["items"]
    assert [i["id"] for i in one] == [ids["b"]]
    assert client.get(url, params={"limit": 51}, headers=h).status_code == 422
    assert client.get(url, params={"limit": 0}, headers=h).status_code == 422
    client.put(f"/movies/{ids['b']}/like", headers=h)
    liked = {i["id"]: i["liked"] for i in client.get(url, headers=h).json()["items"]}
    assert liked[ids["b"]] is True and liked[ids["c"]] is False


def test_for_you_without_likes_then_with_likes(client: TestClient, db_session: Session) -> None:
    h = _viewer(client)
    ids = _catalog(db_session)
    assert client.get("/me/for-you", headers=h).json() == {"has_likes": False, "items": []}
    client.put(f"/movies/{ids['a']}/like", headers=h)
    res = client.get("/me/for-you", headers=h).json()
    assert res["has_likes"] is True
    got = [i["id"] for i in res["items"]]
    assert ids["a"] not in got
    assert got[:2] == [ids["b"], ids["c"]]
    assert all(set(i) >= {"id", "title", "year", "score"} for i in res["items"])
    client.put(f"/movies/{ids['b']}/like", headers=h)
    got2 = [i["id"] for i in client.get("/me/for-you", headers=h).json()["items"]]
    assert ids["b"] not in got2 and ids["a"] not in got2
    assert client.get("/me/for-you", params={"limit": 51}, headers=h).status_code == 422
    assert len(client.get("/me/for-you", params={"limit": 1}, headers=h).json()["items"]) == 1
    # another user's likes do not shape this user's list
    other = _viewer(client)
    assert client.get("/me/for-you", headers=other).json()["has_likes"] is False


def test_upload_is_admin_only(client: TestClient, db_session: Session) -> None:
    viewer = _viewer(client)
    r = _upload(client, viewer, HEAD + "X,2000,Drama,D,A,Plot\n")
    assert r.status_code == 403
    assert db_session.scalars(select(Movie)).all() == []


def test_upload_rejects_bad_files_and_adds_nothing(client: TestClient, db_session: Session) -> None:
    admin = _admin(client, db_session)
    r = _upload(client, admin, HEAD + "X,2000,Drama,D,A,Plot\n", name="m.txt")
    assert r.status_code == 400 and isinstance(r.json()["detail"], str)
    r = _upload(client, admin, "title,year\nX,2000\n")
    assert r.status_code == 400 and "genres" in r.json()["detail"]
    r = _upload(client, admin, b"\xff\xfe\x00bad")
    assert r.status_code == 400
    assert client.post("/admin/movies/upload", headers=admin).status_code == 422
    assert db_session.scalars(select(Movie)).all() == []


def test_upload_reports_counts_and_rebuilds_similarity(
    client: TestClient, db_session: Session
) -> None:
    admin = _admin(client, db_session)
    viewer = _viewer(client)
    t = secrets.token_hex(3)
    seed = _movie(db_session, f"Seed {t}", f"nebula{t} quasar{t}")
    # warm the similarity index before the catalog changes
    assert client.get(f"/movies/{seed}/similar", headers=viewer).json() == {"items": []}
    body = (
        HEAD
        + f"Fresh {t},2001,Sci-Fi|Drama,Dir,A|B,nebula{t} quasar{t}\n"
        + f"fresh {t},2001,Drama,Dir,A,dup in file\n"
        + f"Seed {t},2000,Drama,Dir,A,already there\n"
        + ",2002,Drama,Dir,A,no title\n"
    )
    res = _upload(client, admin, body)
    assert res.status_code == 200
    out = res.json()
    assert (out["added"], out["skipped"], out["rejected"]) == (1, 2, 1)
    assert [(i["row"], i["status"]) for i in out["issues"]] == [
        (2, "skipped"),
        (3, "skipped"),
        (4, "rejected"),
    ]
    assert all(i["reason"] for i in out["issues"])
    again = _upload(client, admin, body).json()
    assert (again["added"], again["skipped"], again["rejected"]) == (0, 3, 1)
    # the new movie is searchable and appears in similar results straight away
    found = client.get("/movies", params={"q": f"fresh {t}"}, headers=viewer).json()
    assert found["total"] == 1
    new_id = found["items"][0]["id"]
    sim = client.get(f"/movies/{seed}/similar", headers=viewer).json()["items"]
    assert [i["id"] for i in sim] == [new_id]
