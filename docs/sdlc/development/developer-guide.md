# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `e4a8a8c` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
WatchNext is a movie recommendation app (search for a movie, get similar titles, like movies, see a 'For you' list, admin-only CSV upload) in a single repository with two applications. `frontend/` is a Vite + React 19 + TypeScript SPA with Tailwind and React Router. Its screens (Login, Signup, ForYou, Search, MovieDetail, AdminUpload) currently render seeded sample data. `backend/` is a FastAPI service with SQLAlchemy that so far only exposes `GET /health`. It has no models, no routers and no implemented endpoints, and the database defaults to local SQLite. `frontend/src/lib/api.ts` is the unused seam for wiring screens to the API. A docker-compose file provides PostgreSQL 16, the backend has a Dockerfile, and a GitHub Actions workflow deploys the app.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Node.js and npm (a version supported by Vite 6 and React 19)
- Python 3.12 (the version used in backend/Dockerfile) and pip
- Docker with Docker Compose (optional, only for the PostgreSQL service or the backend image)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. cd frontend && npm install
2. cd backend && python -m venv .venv
3. cd backend && .venv/bin/pip install -r requirements.txt
4. Optional, to use PostgreSQL instead of the default SQLite file: docker compose up -d db, then set DATABASE_URL to your PostgreSQL connection string before starting the backend
5. Optional, for end-to-end tests: cd frontend && npm run test:e2e:install
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| frontend dev | `cd frontend && npm run dev` | Starts the Vite dev server for the SPA. The backend's default CORS allow-list expects http://localhost:5173. |
| backend dev | `cd backend && .venv/bin/uvicorn app.main:app --reload` | Runs the FastAPI service with auto-reload on port 8000. It uses SQLite (./app.db) unless DATABASE_URL is set. |
| database | `docker compose up -d db` | Starts the PostgreSQL 16 container defined in docker-compose.yml on port 5432. |
| frontend build | `cd frontend && npm run build` | Bundles the SPA with Vite. It does not typecheck. |
| frontend preview | `cd frontend && npm run preview` | Serves the built bundle locally. |
| typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit on the frontend. |
| frontend lint | `cd frontend && npm run lint` | Runs ESLint over the frontend. Use npm run lint:fix to apply automatic fixes. |
| frontend format | `cd frontend && npm run format` | Formats the frontend with Prettier. Use npm run format:check to only check. |
| backend lint | `cd backend && .venv/bin/ruff check .` | Lints the backend with Ruff. |
| backend format | `cd backend && .venv/bin/ruff format .` | Formats the backend with Ruff. |
| backend image | `docker build -t watchnext-backend ./backend` | Builds the backend container image (non-root user, health check on /health, serves on port 8000). |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer/` | Dev container configuration. |
| `.github/workflows/` | deploy.yml: on push to main, builds and pushes the API image and publishes the frontend build. |
| `.quorq/` | Platform handoff metadata (handoff.json). |
| `backend/` | FastAPI service: Dockerfile, requirements.txt, pytest.ini, ruff.toml. |
| `backend/app/` | Application code: main.py (app, lifespan, CORS, /health), database.py (engine, session, get_db), models.py (no tables yet), schemas.py (StubResponse). |
| `backend/app/routers/` | Reserved for generated routers; currently empty apart from __init__.py. |
| `backend/tests/` | pytest suite with shared fixtures in conftest.py. |
| `backend/tests/integration/` | Integration tests (test_health.py). |
| `backend/tests/unit/` | Unit tests (currently only __init__.py). |
| `frontend/` | Vite + React SPA: package.json, vite.config.ts, tsconfig.json, eslint and Playwright config. |
| `frontend/e2e/` | Playwright acceptance tests and support helpers. |
| `frontend/src/` | App.tsx (navigation shell and route table), main.tsx (entry), index.css (brand CSS variables), component tests. |
| `frontend/src/lib/` | api.ts (API client seam), brand.ts (brand tokens), icons.tsx, ui.tsx, navigate.ts. |
| `frontend/src/screens/` | One module per approved screen: Login, Signup, ForYou, Search, MovieDetail, AdminUpload. |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Frontend imports use the `@/` alias for `src/` (set in vite.config.ts and tsconfig.json).
- One module per screen in `src/screens/`; routes are declared in `src/App.tsx`. Login and Signup sit outside the app shell, and unknown paths redirect to /login.
- Styling uses Tailwind plus brand CSS variables such as `var(--brand-fg)`, defined in `src/index.css` and `src/lib/brand.ts`.
- Frontend unit tests (Vitest, jsdom) live in `src/` beside the code they cover. Playwright specs live in `e2e/` and are excluded from Vitest.
- TypeScript is strict, but `noImplicitAny` and `strictNullChecks` are turned off.
- Frontend API calls are meant to go through `apiFetch` in `src/lib/api.ts`. It sends a session token as the bearer (stored in localStorage) and falls back to the shared key. Screens do not use it yet.
- Backend configuration comes from environment variables: DATABASE_URL (defaults to SQLite) and ALLOWED_ORIGINS (comma-separated, defaults to the Vite dev origins).
- Tables are created from the SQLAlchemy models at app startup via the lifespan handler; there are no migrations yet. Models inherit `Base` from `app.database`.
- Unimplemented endpoints are meant to return the typed `StubResponse` from schemas.py. Use `get_db` for a per-request session.
- Backend lint and format use Ruff (ruff.toml). Frontend uses ESLint and Prettier.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| frontend unit | `cd frontend && npm test` | Runs Vitest component tests under src/ (passes even when no tests are found). |
| frontend e2e | `cd frontend && npm run test:e2e` | Runs Playwright specs from e2e/. Without E2E_BASE_URL it starts the backend from backend/.venv and builds and serves the frontend itself. |
| e2e browser install | `cd frontend && npm run test:e2e:install` | Installs the Chromium browser Playwright needs. |
| backend | `cd backend && .venv/bin/pytest` | Runs the pytest suite in backend/tests (pytest.ini sets pythonpath to the backend directory). |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| `npm run build` succeeds but `npm run typecheck` reports errors. | This is expected. The build does not typecheck, and some generated screens have loosely typed state. Fix the reported types before relying on the typecheck. |
| Playwright e2e fails to start the backend (cannot find .venv/bin/python). | Create the virtual environment in backend/ and install dependencies: `cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt`. Or set E2E_BASE_URL to run against an already deployed app. |
| Playwright reports that the browser executable is missing. | Run `cd frontend && npm run test:e2e:install`. |
| The backend fails on startup with a database connection error. | DATABASE_URL points at a server that is not running. Start it with `docker compose up -d db`, or unset DATABASE_URL to use the default local SQLite file. |
| The browser blocks API calls with a CORS error. | By default only http://localhost:5173 and http://127.0.0.1:5173 are allowed. Set ALLOWED_ORIGINS to a comma-separated list that includes the frontend's origin. |
| `import app` fails when running pytest. | Run pytest from the backend/ directory so pytest.ini's `pythonpath = .` applies. |
| The frontend shows sample data and never calls the API. | That is the current state: the screens use seeded data and `src/lib/api.ts` is not imported yet. Wire each screen to an endpoint with `apiFetch`. The backend only has GET /health, so endpoints must be implemented first. |
| Concern about secrets in the frontend build. | deploy.yml sets VITE_API_SECRET_KEY inline in the workflow, and every VITE_ variable is inlined into the public browser bundle. Treat it as visible to anyone, and move real secrets to GitHub secrets or server-side config. |
<!-- sdlc:auto:end troubleshooting -->
