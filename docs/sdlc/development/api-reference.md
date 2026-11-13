# API Reference

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start endpoints -->
| Method | Path | Handler | Source | Summary |
|---|---|---|---|---|
| POST | /auth/login | login | `backend/app/routers/auth.py:67` | — |
| POST | /auth/logout | logout | `backend/app/routers/auth.py:39` | — |
| GET | /auth/me | me | `backend/app/routers/auth.py:46` | — |
| POST | /auth/signup | signup | `backend/app/routers/auth.py:51` | — |
| GET | /health | health | `backend/app/main.py:61` | Liveness probe. |
| GET | /me/for-you | for_you | `backend/app/routers/movies.py:89` | — |
| GET | /me/likes | likes | `backend/app/routers/movies.py:144` | — |
| GET | /movies | list_movies | `backend/app/routers/movies.py:33` | — |
| GET | /movies/{movie_id} | movie_detail | `backend/app/routers/movies.py:63` | — |
| DELETE | /movies/{movie_id}/like | unlike_movie | `backend/app/routers/movies.py:130` | — |
| POST | /movies/{movie_id}/like | like_movie | `backend/app/routers/movies.py:114` | — |
| PUT | /movies/{movie_id}/like | like_movie | `backend/app/routers/movies.py:113` | — |
<!-- sdlc:auto:end endpoints -->

<!-- sdlc:auto:start drift -->
**Designed but missing:**

- GET /movies/{movie_id}/similar
- POST /admin/movies/upload

**Code only:**

- POST /movies/{movie_id}/like
<!-- sdlc:auto:end drift -->

<!-- sdlc:auto:start source -->
Generated from commit `3d3b149`
<!-- sdlc:auto:end source -->
