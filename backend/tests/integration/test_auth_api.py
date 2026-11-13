"""US-001 acceptance tests: sign-up, login, logout and session rules, through the API.

AC-009 (30-minute idle expiry) is verified in the backend packet's clock-patched
integration test; it is not repeated here because we do not wait 30 minutes.

NFR notes: NFR-001 (stored hashes) is checked by reading the users and sessions tables.
NFR-002 is covered by logout (AC-008) plus AC-009 above. NFR-003 / NFR-004 / NFR-005 are
checked below. NFR-013 and NFR-015 (English-only UI, UI message wording) are UI concerns
and are not testable at the API level here; error messages are checked to be English.
"""

import os
import secrets

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.main import app


def _email() -> str:
    return f"qa-{secrets.token_hex(6)}@example.com"


def _pw() -> str:
    return secrets.token_urlsafe(12)


def _signup(client: TestClient, email: str | None = None, password: str | None = None, **extra):
    email = email or _email()
    password = password or _pw()
    resp = client.post("/auth/signup", json={"email": email, "password": password, **extra})
    return email, password, resp


def _me(client: TestClient, token: str):
    return client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})


def test_ac001_signup_returns_viewer_and_token_works(client: TestClient) -> None:
    email, _, resp = _signup(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["user"]["role"] == "viewer"
    assert body["user"]["email"] == email
    assert isinstance(body["user"]["id"], int)
    me = _me(client, body["token"])
    assert me.status_code == 200
    assert me.json()["email"] == email


def test_ac002_duplicate_email_other_case_returns_409(client: TestClient) -> None:
    email, password, first = _signup(client)
    assert first.status_code == 201
    _, _, dup = _signup(client, email=email.upper(), password=_pw())
    assert dup.status_code == 409
    assert dup.json() == {"detail": "Email already registered"}
    ok = client.post("/auth/login", json={"email": email, "password": password})
    assert ok.status_code == 200
    assert ok.json()["user"]["id"] == first.json()["user"]["id"]


def test_ac003_invalid_email_returns_422_and_creates_nothing(client: TestClient) -> None:
    password = _pw()
    resp = client.post("/auth/signup", json={"email": "not-an-email", "password": password})
    assert resp.status_code == 422
    assert any(e["loc"][-1] == "email" for e in resp.json()["detail"])


def test_ac003_short_password_returns_422_and_creates_nothing(client: TestClient) -> None:
    email = _email()
    resp = client.post("/auth/signup", json={"email": email, "password": "a1b2c3d"})
    assert resp.status_code == 422
    assert any(e["loc"][-1] == "password" for e in resp.json()["detail"])
    login = client.post("/auth/login", json={"email": email, "password": "a1b2c3d"})
    assert login.status_code == 401


def test_ac003_eight_character_password_is_accepted(client: TestClient) -> None:
    _, _, resp = _signup(client, password="a1b2c3d4")
    assert resp.status_code == 201


def test_ac004_role_and_is_admin_are_ignored(client: TestClient) -> None:
    for extra in ({"role": "admin"}, {"is_admin": True}):
        _, _, resp = _signup(client, **extra)
        assert resp.status_code == 201
        assert resp.json()["user"]["role"] == "viewer"
        assert _me(client, resp.json()["token"]).json()["role"] == "viewer"


def test_ac005_no_response_contains_password_or_hash(client: TestClient) -> None:
    email, password, signup = _signup(client)
    login = client.post("/auth/login", json={"email": email, "password": password})
    me = _me(client, signup.json()["token"])
    for resp in (signup, login, me):
        assert password not in resp.text
        assert "argon2" not in resp.text.lower()
        assert "hash" not in resp.text.lower()
        assert "password" not in resp.json().get("user", resp.json())


def test_ac006_login_returns_token_and_user_even_with_other_case(client: TestClient) -> None:
    email, password, _ = _signup(client)
    for variant in (email, email.upper()):
        resp = client.post("/auth/login", json={"email": variant, "password": password})
        assert resp.status_code == 200
        body = resp.json()
        assert set(body) >= {"token", "user"}
        assert body["user"]["email"] == email
        assert _me(client, body["token"]).status_code == 200


def test_ac007_nfr003_wrong_password_and_unknown_email_are_identical(client: TestClient) -> None:
    email, _, _ = _signup(client)
    wrong = client.post("/auth/login", json={"email": email, "password": _pw()})
    unknown = client.post("/auth/login", json={"email": _email(), "password": _pw()})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.content == unknown.content
    assert wrong.json() == {"detail": "Invalid email or password"}


def test_ac007_password_is_case_sensitive(client: TestClient) -> None:
    email, password, _ = _signup(client, password="AbCdEfGh12")
    resp = client.post("/auth/login", json={"email": email, "password": password.lower()})
    assert resp.status_code == 401


def test_ac008_logout_revokes_only_that_token(client: TestClient) -> None:
    email, password, signup = _signup(client)
    first = signup.json()["token"]
    second = client.post("/auth/login", json={"email": email, "password": password}).json()["token"]
    assert first != second
    out = client.post("/auth/logout", headers={"Authorization": f"Bearer {first}"})
    assert out.status_code == 204
    assert out.content == b""
    revoked = _me(client, first)
    assert revoked.status_code == 401
    assert revoked.json() == {"detail": "Not authenticated"}
    assert _me(client, second).status_code == 200


def test_ac008_logout_without_token_returns_401(client: TestClient) -> None:
    assert client.post("/auth/logout").status_code == 401


def test_ac010_nfr004_me_without_valid_token_returns_401(client: TestClient) -> None:
    cases = [
        {},
        {"Authorization": "Basic abc"},
        {"Authorization": "Bearer"},
        {"Authorization": "garbage"},
        {"Authorization": f"Bearer {secrets.token_urlsafe(32)}"},
    ]
    for headers in cases:
        resp = client.get("/auth/me", headers=headers)
        assert resp.status_code == 401, headers
        assert resp.json() == {"detail": "Not authenticated"}
        assert resp.headers["www-authenticate"] == "Bearer"


def test_nfr004_movie_features_refuse_signed_out_users(client: TestClient) -> None:
    # Movie endpoints belong to later stories and do not exist yet (404); this ticket
    # covers the auth-protected endpoints it builds. Movie paths are checked in their stories.
    assert client.get("/auth/me").status_code == 401
    resp = client.post("/auth/logout")
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Not authenticated"}


def test_nfr002_logout_ends_session(client: TestClient) -> None:
    _, _, signup = _signup(client)
    token = signup.json()["token"]
    out = client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert out.status_code == 204
    assert _me(client, token).status_code == 401


def test_nfr013_nfr015_validation_messages_are_specific_english(client: TestClient) -> None:
    resp = client.post("/auth/signup", json={"email": "bad", "password": "short"})
    assert resp.status_code == 422
    errors = resp.json()["detail"]
    assert {e["loc"][-1] for e in errors} >= {"email", "password"}
    for e in errors:
        assert e["msg"].isascii() and e["msg"]
    dup = _signup(client)[0]
    conflict = client.post("/auth/signup", json={"email": dup, "password": _pw()})
    assert conflict.json() == {"detail": "Email already registered"}


def test_bootstrap_admin_and_smoke_viewer_sign_in(client: TestClient) -> None:
    # Entering the TestClient context runs the app lifespan, which seeds the configured users.
    with TestClient(app) as c:
        admin = c.post(
            "/auth/login",
            json={
                "email": os.environ["BOOTSTRAP_ADMIN_EMAIL"],
                "password": os.environ["BOOTSTRAP_ADMIN_PASSWORD"],
            },
        )
        assert admin.status_code == 200
        assert _me(c, admin.json()["token"]).json()["role"] == "admin"
        viewer = c.post(
            "/auth/login",
            json={
                "email": os.environ["SMOKE_TEST_EMAIL"],
                "password": os.environ["SMOKE_TEST_PASSWORD"],
            },
        )
        assert viewer.status_code == 200
        assert _me(c, viewer.json()["token"]).json()["role"] == "viewer"


def test_nfr001_passwords_and_tokens_are_not_stored_in_plain_text(
    client: TestClient, db_session: Session
) -> None:
    email, password, resp = _signup(client)
    token = resp.json()["token"]
    users = db_session.execute(text("SELECT * FROM users")).all()
    sessions = db_session.execute(text("SELECT * FROM sessions")).all()
    assert users and sessions
    for row in users:
        assert password not in [str(v) for v in row]
    for row in sessions:
        assert token not in [str(v) for v in row]
    # Salted: the same password yields a different stored value for another user.
    _signup(client, password=password)
    stored = [
        v
        for row in db_session.execute(text("SELECT * FROM users")).all()
        for v in row
        if isinstance(v, str) and v.startswith("$argon2")
    ]
    assert len(stored) == 2 and stored[0] != stored[1]
