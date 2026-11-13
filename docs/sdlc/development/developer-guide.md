# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `cfd9e5e` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
Two applications in one repository for 'WatchNext', a self-contained movie recommendation app. The frontend is a Vite + React 19 SPA (TypeScript, Tailwind v4, react-router-dom) whose screens run on seeded sample data; src/lib/api.ts is the seam for real API calls. The backend is a FastAPI 0.115 service using SQLAlchemy 2 and Pydantic 2. It currently has only a /health route, an empty models module, a StubResponse schema, and an empty routers package. The database defaults to local SQLite and can be pointed at PostgreSQL through DATABASE_URL. Recommendations, auth, likes and CSV upload from the README are not implemented in the files shown.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Node.js and npm (a version that supports Vite 6 and React 19)
- Python 3.12 (the version the backend Dockerfile uses) and pip
- Docker with Compose (optional: only needed for the PostgreSQL 16 service in docker-compose.yml)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. cd backend
2. python -m venv .venv
3. .venv/bin/pip install -r requirements.txt
4. cd ../frontend
5. npm install
6. npm run test:e2e:install   # optional: downloads Chromium for Playwright e2e tests
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| backend dev | `cd backend && .venv/bin/python -m uvicorn app.main:app --reload` | Starts the FastAPI service with auto-reload on port 8000 (SQLite file ./app.db by default). Health check: GET /health. |
| frontend dev | `cd frontend && npm run dev` | Starts the Vite dev server (the backend's default CORS allow-list expects http://localhost:5173). |
| frontend build | `cd frontend && npm run build` | Bundles the SPA with Vite. Per the frontend README, this does not typecheck. |
| frontend preview | `cd frontend && npm run preview` | Serves the built bundle locally. |
| typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit over src. |
| postgres | `docker compose up db` | Starts the PostgreSQL 16 service (user/password/db all 'app', port 5432). Optional; set DATABASE_URL to use it. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer/` | Dev container configuration. |
| `.quorq/` | Platform handoff metadata (handoff.json). |
| `backend/` | FastAPI service: Dockerfile, requirements.txt, pytest.ini, ruff.toml. |
| `backend/app/` | Application code: main.py (app, CORS, lifespan, /health), database.py (engine, SessionLocal, Base, get_db), models.py, schemas.py. |
| `backend/app/routers/` | Package for generated routers; currently empty apart from __init__.py. |
| `backend/tests/` | pytest suite with conftest.py, plus integration/ (test_health.py) and unit/ subpackages. |
| `frontend/` | Vite + React SPA: package.json, vite, TypeScript, ESLint, Prettier and Playwright configs. |
| `frontend/src/` | SPA source: main.tsx entry, index.css, test-setup.ts, and lib/ (api.ts, icons.tsx, navigate.ts, ui.tsx). main.tsx imports '@/App', which was not in the provided tree. |
| `frontend/e2e/` | Playwright acceptance specs (example.spec.ts) and support helpers (support/admin.ts). |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend models inherit from app.database.Base; main.py imports app.models so tables register before create_all runs on startup.
- Tables are created in the FastAPI lifespan handler (not at import) and there are no migrations; the code says to replace this with Alembic.
- Generated routes are meant to be stubs returning the typed StubResponse until implemented; only /health is real.
- Intended layout is one router per architecture component under backend/app/routers/.
- Database sessions come from the get_db dependency, one per request.
- Backend configuration is via env vars: DATABASE_URL (default sqlite:///./app.db) and ALLOWED_ORIGINS (comma separated; defaults to the localhost:5173 dev origins).
- Backend linting and formatting use Ruff; backend tests live under tests/unit and tests/integration.
- Frontend uses the '@' alias for src/, Prettier for formatting, ESLint for linting, and Vitest component tests that sit beside the components they cover (src/**/*.{test,spec}.{ts,tsx}).
- Frontend API calls go through apiFetch in src/lib/api.ts, which reads VITE_API_BASE_URL (default http://localhost:8000) and VITE_API_SECRET_KEY, and sends a bearer token from localStorage ('session_token') ahead of the shared secret.
- tsconfig is strict but sets noImplicitAny and strictNullChecks to false.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend tests | `cd backend && pytest` | Runs the pytest suite (pytest.ini sets pythonpath=. and testpaths=tests). |
| backend lint | `cd backend && ruff check .` | Lints the backend with Ruff. |
| backend format | `cd backend && ruff format .` | Formats the backend with Ruff. |
| frontend unit tests | `cd frontend && npm test` | Runs Vitest once (vitest run --passWithNoTests) in jsdom. |
| frontend lint | `cd frontend && npm run lint` | Runs ESLint over the frontend; use npm run lint:fix to apply fixes. |
| frontend format check | `cd frontend && npm run format:check` | Checks Prettier formatting without writing changes. |
| frontend e2e | `cd frontend && npm run test:e2e` | Runs Playwright specs from e2e/. Without E2E_BASE_URL it starts the backend from backend/.venv and builds and previews the frontend on port 4173; with E2E_BASE_URL set it tests that deployment. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| npm run test:e2e fails to start the backend web server. | The Playwright config runs backend/.venv/bin/python, so create the virtualenv and install requirements first: cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt. |
| Browser requests to the API are blocked by CORS. | By default only http://localhost:5173 and http://127.0.0.1:5173 are allowed. Set ALLOWED_ORIGINS (comma separated) to the frontend's origin before starting the backend. |
| Bare `pytest` cannot import `app`. | Run pytest from the backend/ directory so pytest.ini's pythonpath = . applies. |
| Backend fails at startup when DATABASE_URL points at PostgreSQL. | Tables are created at startup, so the server must be reachable. Start it with `docker compose up db` and check that DATABASE_URL matches the app/app/app credentials, or unset DATABASE_URL to use local SQLite. |
| npm run build succeeds but npm run typecheck reports errors. | This is expected: the build does not typecheck. Fix the reported type errors, typically untyped useState({}) values read for named fields. |
| The frontend does not reach the backend. | The frontend defaults to http://localhost:8000. Set VITE_API_BASE_URL at build or dev time if the API runs elsewhere. The generated screens still render seeded sample data and do not call the API yet. |
<!-- sdlc:auto:end troubleshooting -->
