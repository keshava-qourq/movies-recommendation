# API Reference

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start endpoints -->
| Method | Path | Handler | Source | Summary |
|---|---|---|---|---|
| POST | /admin/movies/upload | upload_movies | `backend/app/routers/admin.py:27` | — |
| POST | /auth/login | login | `backend/app/routers/auth.py:68` | — |
| POST | /auth/logout | logout | `backend/app/routers/auth.py:39` | — |
| GET | /auth/me | me | `backend/app/routers/auth.py:46` | — |
| POST | /auth/signup | signup | `backend/app/routers/auth.py:51` | — |
| GET | /health | health | `backend/app/main.py:62` | Liveness probe. |
| GET | /me/for-you | for_you | `backend/app/routers/movies.py:127` | — |
| GET | /me/likes | likes | `backend/app/routers/movies.py:175` | — |
| GET | /movies | list_movies | `backend/app/routers/movies.py:37` | — |
| GET | /movies/{movie_id} | movie_detail | `backend/app/routers/movies.py:69` | — |
| DELETE | /movies/{movie_id}/like | unlike_movie | `backend/app/routers/movies.py:161` | — |
| POST | /movies/{movie_id}/like | like_movie | `backend/app/routers/movies.py:145` | — |
| PUT | /movies/{movie_id}/like | like_movie | `backend/app/routers/movies.py:144` | — |
| GET | /movies/{movie_id}/similar | similar | `backend/app/routers/movies.py:113` | — |
<!-- sdlc:auto:end endpoints -->

<!-- sdlc:auto:start drift -->
**Code only:**

- POST /movies/{movie_id}/like
<!-- sdlc:auto:end drift -->

<!-- sdlc:auto:start source -->
Generated from commit `9be6a27`
<!-- sdlc:auto:end source -->
