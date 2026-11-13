# Behaviour rules

How this app behaves where the requirements and the API contract do not say. QA's
tests and the code both follow these rules. The platform keeps this file: the first
rules come from the contract and the code, and each later rule from a decision made
when a test and the code disagreed.

- The backend is a stub today (only GET /health works, models are empty), so these rules describe the behaviour the architecture implies and the code must be built to match them.
- Every error response is JSON of the form {"detail": ...}, the FastAPI default, with `detail` a string for 400, 401, 403, 404 and 409.
- Invalid input returns 422 with FastAPI's standard `detail` list of objects holding `loc`, `msg` and `type`, so each message names its field (for example loc ends in "email" or "password").
- A missing, malformed, unknown, revoked or idle-expired Authorization header returns 401 {"detail": "Not authenticated"} with a `WWW-Authenticate: Bearer` header, and changes no data.
- A signed-in viewer calling an admin endpoint gets 403 {"detail": "Admin access required"}, and an unauthenticated caller gets 401 and not 403.
- A movie id that does not exist, or is not a valid integer, returns 404 {"detail": "Movie not found"} and never 422 or 500, including on like, unlike, detail and similar.
- Duplicate signup email returns 409 {"detail": "Email already registered"}, and the check ignores letter case.
- Emails are trimmed and stored lowercased, so login and signup match emails case-insensitively and the user object returns the lowercased email; passwords are case-sensitive and never trimmed.
- Signup returns 201 with {token, user: {id, email, role}} and login returns 200 with the same shape, so signup signs the user in; the role is always "viewer" and a submitted role field is ignored.
- Login with a wrong password and login with an unknown email both return the identical 401 {"detail": "Invalid email or password"}.
- The session token is an opaque random string (at least 32 bytes of entropy, URL-safe) that is returned once in the response body, sent as `Authorization: Bearer <token>`, and stored on the server only as a SHA-256 hash.
- Each login or signup creates a new session and does not end the user's other sessions, so two tokens for one user can be valid at once.
- A session expires after 30 minutes without any authenticated request, each authenticated request refreshes last_seen_at, and an expired session returns 401 on every endpoint including /auth/me.
- POST /auth/logout returns 204 with no body, revokes only the token used, and that token returns 401 afterwards while the user's other sessions keep working.
- Passwords must be at least 8 characters, are hashed with salted Argon2, and no response ever contains the password or its hash.
- Movie ids and user ids are server-generated integers, and the API returns them as JSON numbers.
- A movie is unique by lowercased trimmed title plus year, so "Heat" (1995) and "heat" (1995) are the same movie while the same title in another year is a different one.
- GET /movies takes `q`, `limit` and `offset` query parameters, with limit defaulting to 20 and at most 100, offset defaulting to 0, and `total` counting all matches and not just the page.
- GET /movies lists results alphabetically by lowercased title, then by id, matches `q` as a case-insensitive substring of the title after trimming it, and treats a blank `q` as no filter.
- A limit above 100, a limit below 1 or a negative offset on GET /movies returns 422 and is not silently clamped.
- GET /movies/{id}/similar and GET /me/for-you return at most 10 items sorted by score descending and then by id ascending, with `score` a number from 0 to 1 and items with a score of 0 left out.
- GET /me/likes returns the caller's liked movies, most recently liked first, with no paging, and a user who has no likes gets {"items": []}.
- Timestamps are stored as UTC timestamptz and any returned in JSON are ISO 8601 UTC with a Z suffix, and the movie `year` is a plain integer.
- The admin upload counts rows from 1 for the first data row after the header, reads the file as UTF-8, and returns 400 when the file is not CSV or the header lacks a required column.
- Tests create their own users and movies through the API (signup, and the upload endpoint with a seeded admin from server config) with a unique email per test such as a random suffix, never write to the database directly, and never rely on data from another test.
