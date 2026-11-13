# Traceability Matrix

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start legend -->
Built from recorded links, not written by a model: requirement key → plan item (`source_stable_key`) → development ticket (`stable_key`) → the ticket's test steps → the last live deployment that started after the work finished. **AC tests** counts the story's acceptance criteria that have a test case, and those whose test cases all passed in the latest finished E2E run.
<!-- sdlc:auto:end legend -->

<!-- sdlc:auto:start matrix -->
| Requirement | Epic | Title | Plan items | Sprint | Design | Code | Commits | Ticket | Tests | AC tests | Deployed |
|---|---|---|---|---|---|---|---|---|---|---|---|
| US-001 | EPIC-001 | Sign up with email and password | US-001 | 1 | POST /auth/signup, api, db, sessions, spa, users | backend/app/config.py, backend/app/deps.py, backend/app/main.py, backend/app/routers/auth.py, backend/app/routers/movies.py +17 more | 0ea4226, 7069e8c | delivered | not run | 5/5 tested · 5/5 passing | — |
| US-002 | EPIC-001 | Log in and log out | US-002 | 1 | GET /auth/me, POST /auth/login, POST /auth/logout, api, sessions, spa, users | frontend/e2e/login.spec.ts, frontend/src/App.tsx | d38cdef, 7069e8c | delivered | not run | 5/5 tested · 5/5 passing | — |
| US-003 | EPIC-001 | First admin account from server config | US-003 | 2 | api, bootstrap, db, users | — | — | not started | not run | 0/4 tested · 0/4 passing | — |
| US-004 | EPIC-001 | No password reset or email verification | US-004 | 2 | spa | — | — | not started | not run | 0/2 tested · 0/2 passing | — |
| US-005 | EPIC-002 | Sample catalog available after install | US-005 | 1 | bootstrap, db, movies | backend/app/bootstrap.py, backend/app/data/sample_movies.json, backend/app/main.py, backend/app/routers/movies.py, backend/tests/integration/test_sample_catalog.py +1 more | 7069e8c | skipped | not run | 3/3 tested · 3/3 passing | — |
| US-006 | EPIC-002 | No outside dependencies at build or run time | US-006 | 4 | api, spa, web | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
| US-007 | EPIC-002 | Single deployable app with embedded database | US-007 | 1 | GET /health, api, db, web | README.md, backend/Dockerfile, backend/app/database.py, backend/app/migrations/versions/0001_initial_schema.py, backend/app/models.py +3 more | d38cdef | delivered | succeeded | 2/2 tested · 2/2 passing | — |
| US-008 | EPIC-003 | Search movies by title | US-008 | 2 | GET /movies, api, movies, spa | — | — | not started | not run | 0/4 tested · 0/4 passing | — |
| US-009 | EPIC-003 | Movie detail page | US-009 | 2 | GET /movies/{movie_id}, api, likes, movies, spa | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
| US-010 | EPIC-003 | Generated placeholder artwork | US-010 | 4 | spa | — | — | not started | not run | 0/2 tested · 0/2 passing | — |
| US-011 | EPIC-004 | See similar movies ranked by similarity | US-011 | 3 | GET /movies/{movie_id}/similar, api, movies, similarity, spa | — | — | not started | not run | 0/5 tested · 0/5 passing | — |
| US-012 | EPIC-004 | Similarity computed in-house | US-012 | 2 | movies, similarity | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
| US-013 | EPIC-005 | Like and unlike movies | US-013 | 2 | DELETE /movies/{movie_id}/like, GET /me/likes, PUT /movies/{movie_id}/like, api, db, likes, movies, spa | — | — | not started | not run | 0/5 tested · 0/5 passing | — |
| US-014 | EPIC-005 | For you list from all likes | US-014 | 3 | GET /me/for-you, api, likes, movies, similarity, spa | — | — | not started | not run | 0/4 tested · 0/4 passing | — |
| US-015 | EPIC-005 | Prompt when there are no likes | US-015 | 3 | GET /me/for-you, likes, spa | — | — | not started | not run | 0/2 tested · 0/2 passing | — |
| US-016 | EPIC-006 | Upload movies from a CSV file | US-016 | 3 | POST /admin/movies/upload, api, db, movies, similarity, spa | — | — | not started | not run | 0/5 tested · 0/5 passing | — |
| US-017 | EPIC-006 | Validate rows and handle duplicates | US-017 | 3 | POST /admin/movies/upload, api, movies, spa | — | — | not started | not run | 0/4 tested · 0/4 passing | — |
| US-018 | EPIC-007 | Setup and usage guide | US-018 | 4 | — | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
<!-- sdlc:auto:end matrix -->
