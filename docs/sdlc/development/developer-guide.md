# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `9be6a27` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
WatchNext is a self-contained movie recommendation app in a single repository with two applications. The backend (`backend/`) is a FastAPI service on PostgreSQL via SQLAlchemy 2 and Alembic. It handles email/password signup and login with opaque bearer-token sessions, a movie catalog seeded from a bundled sample (`app/data/sample_movies.json`), likes, and cosine-similarity recommendations (`app/similarity.py`). Admins can upload movies as CSV. The frontend (`frontend/`) is a Vite + React 19 + TypeScript SPA with Tailwind and react-router. It talks to the backend through `src/lib/api.ts`, with screens for Login, Signup, For you, Search, Movie detail and Admin upload. Migrations and seeding run on backend startup. The app is designed to call no outside services at build time or run time.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Node.js and npm (a version supported by Vite 6 and React 19)
- Python 3.12 (the version used by backend/Dockerfile) with pip
- A PostgreSQL database (the repo's docker-compose.yml provides PostgreSQL 16, which needs Docker with Compose)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. Start PostgreSQL locally: docker compose up -d db
2. Create a backend virtualenv (Playwright's e2e config expects backend/.venv): cd backend && python -m venv .venv
3. Install backend dependencies: cd backend && .venv/bin/pip install -r requirements.txt
4. Set the required database URL for the backend (a postgresql+psycopg:// SQLAlchemy URL, using the credentials of your database): export DATABASE_URL="<database-url>"
5. Optional, to create the first admin on startup: export BOOTSTRAP_ADMIN_EMAIL="<admin-email>" and export BOOTSTRAP_ADMIN_PASSWORD="<admin-password>"
6. Optional, to seed one viewer: export SMOKE_TEST_EMAIL="<viewer-email>" and export SMOKE_TEST_PASSWORD="<viewer-password>"
7. Install frontend dependencies: cd frontend && npm install
8. Optional: point the frontend at the backend by setting VITE_API_BASE_URL before running the dev server, e.g. export VITE_API_BASE_URL="http://localhost:8000" (see .env.example and ENVIRONMENT.md for the full list of settings)
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| backend | `cd backend && .venv/bin/python -m uvicorn app.main:app --reload` | Starts the FastAPI API on port 8000. On startup it runs Alembic migrations, seeds the configured users and loads the sample movies. Needs DATABASE_URL. |
| frontend dev | `cd frontend && npm run dev` | Starts the Vite dev server for the React SPA. |
| frontend build | `cd frontend && npm run build` | Bundles the frontend with Vite. It does not typecheck. |
| frontend preview | `cd frontend && npm run preview` | Serves the built bundle locally. |
| typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit over the frontend. |
| format (frontend) | `cd frontend && npm run format` | Formats the frontend with Prettier. Use `npm run format:check` to only check. |
| docker image (backend) | `docker build -t watchnext-api ./backend` | Builds the backend container image, which runs uvicorn on port 8000 as an unprivileged user and has a /health healthcheck. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer/` | Dev container configuration. |
| `.github/workflows/` | deploy.yml: pushes the API image to ECR and publishes the frontend build to AWS Amplify on pushes to main. |
| `.quorq/` | Platform handoff and preparation metadata (handoff.json, prepared.json). |
| `docs/` | Project documentation (behaviour-rules.md). |
| `backend/` | FastAPI service: Dockerfile, requirements.txt, pytest.ini, ruff.toml and conftest.py. |
| `backend/app/` | Application code: main.py, config.py, database.py, deps.py, security.py, models.py, schemas.py, similarity.py, bootstrap.py. |
| `backend/app/routers/` | API routers: auth.py, movies.py, admin.py. |
| `backend/app/migrations/` | Alembic environment, the startup runner and versioned migrations (versions/0001_initial_schema.py). |
| `backend/app/data/` | sample_movies.json, the built-in sample catalog of about 50 movies. |
| `backend/scripts/` | Helper scripts such as check_connections.py. |
| `backend/tests/` | pytest suites: unit/ and integration/. |
| `frontend/` | Vite + React SPA with package.json, vite.config.ts, playwright.config.ts, eslint and prettier config. |
| `frontend/src/` | App.tsx (shell, route table, auth guards), main.tsx, index.css and the self-contained test. |
| `frontend/src/lib/` | api.ts (fetch client and session token handling), auth.ts, brand.ts, icons.tsx, ui.tsx, navigate.ts, Artwork.tsx. |
| `frontend/src/screens/` | One module per screen (Login, Signup, ForYou, Search, MovieDetail, AdminUpload) with Vitest tests beside them. |
| `frontend/e2e/` | Playwright acceptance specs and shared support helpers. |
| `frontend/coverage/` | Generated coverage reports. |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend: one FastAPI router per component (auth, movies, admin) included in app/main.py. Auth is enforced with the dependencies get_current_user and require_admin.
- Schema changes go only through Alembic migrations in backend/app/migrations/versions, never create_all. Any change to models.py needs a matching migration.
- Emails are stored lowercased. A movie is unique by lowercased title (title_key) plus year.
- Sessions are opaque bearer tokens; only the sha256 hash is stored server-side. They are sent as `Authorization: Bearer <token>`, not as cookies.
- Migrations and seeding run in the FastAPI lifespan on startup, not at import time.
- CSV upload uses the '\|' separator inside genres and cast cells, and required columns title, year, genres, director, cast, plot.
- Backend linting and formatting use ruff (backend/ruff.toml).
- Frontend: TypeScript with the `@` alias mapped to `src/`. Screens live in src/screens, shared UI in src/lib, and tests sit beside the components they cover (*.test.tsx).
- Frontend API calls go through apiFetch in src/lib/api.ts, which attaches the session token and triggers the unauthorized handler on a 401.
- Frontend styling uses Tailwind with brand CSS variables (var(--brand-*)).
- Playwright specs live in frontend/e2e and Vitest only collects src/**/*.{test,spec}.{ts,tsx}.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend tests | `cd backend && .venv/bin/python -m pytest` | Runs the unit and integration suites under backend/tests (pytest.ini sets pythonpath and testpaths). The integration tests need a reachable PostgreSQL via DATABASE_URL. |
| backend lint | `cd backend && .venv/bin/ruff check .` | Lints the backend with ruff. Run `.venv/bin/ruff format .` to format. |
| frontend unit tests | `cd frontend && npm test` | Runs Vitest component tests under src/ (jsdom). |
| frontend lint | `cd frontend && npm run lint` | Runs ESLint across the frontend. `npm run lint:fix` applies automatic fixes. |
| e2e install | `cd frontend && npm run test:e2e:install` | Installs the Chromium browser used by Playwright. |
| e2e | `cd frontend && npm run test:e2e` | Runs the Playwright specs in e2e/. Without E2E_BASE_URL it starts the backend from backend/.venv on port 8000 (DATABASE_URL must be set) and builds and serves the frontend on port 4173. With E2E_BASE_URL set it runs against that deployed URL. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| The backend fails at import with "DATABASE_URL is not set". | Export DATABASE_URL as a postgresql+psycopg:// SQLAlchemy URL for your database (for example the one started with `docker compose up -d db`) before running uvicorn or pytest. |
| The backend cannot connect to PostgreSQL on startup. | Make sure the database container is running and healthy (`docker compose up -d db`, then `docker compose ps`) and that the credentials in DATABASE_URL match those of the database. |
| No admin account exists, so the Upload movies page is not available. | Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD on the backend and restart it. The admin is created on startup only if no user with that email exists. |
| The frontend cannot reach the API (requests go to the frontend's own origin) or the browser reports a CORS error. | Set VITE_API_BASE_URL to the backend URL when starting or building the frontend. Add the frontend origin to the backend's ALLOWED_ORIGINS (CORS_ALLOWED_ORIGINS overrides it). |
| You are sent back to the login page with a session-expired notice. | Sessions expire after 30 minutes without an authenticated request. Log in again, or change the SESSION_IDLE_MINUTES setting on the backend. |
| `npm run build` succeeds but `npm run typecheck` reports errors. | This is expected: the build does not typecheck. Fix the reported types, since generated screens can pass rendering but still fail tsc. |
| `npm run test:e2e` fails because the browser or the backend cannot be started. | Run `npm run test:e2e:install` first, and make sure backend/.venv exists with the requirements installed and DATABASE_URL is set, because the config launches backend/.venv/bin/python. |
| A CSV upload is rejected. | Use a UTF-8 .csv file under 5 MB with a header naming title, year, genres, director, cast and plot. Separate multiple genres or cast names with '\|'. The response lists the row number and reason for each skipped or rejected row. |
<!-- sdlc:auto:end troubleshooting -->
