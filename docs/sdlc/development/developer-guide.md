# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `49dd10d` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
WatchNext is a self-contained movie recommendation app in one repository with two applications. The backend (`backend/`) is a FastAPI service on SQLAlchemy 2, Alembic migrations and PostgreSQL. It has email/password signup and login with opaque bearer-token sessions, and viewer and admin roles. It also has a movie list/search endpoint, per-user likes, and a 'For you' endpoint that ranks unliked movies by cosine similarity on genres, director, cast and plot words. Migrations run and the sample movie catalog and configured users are seeded on startup. The frontend (`frontend/`) is a Vite + React 19 + TypeScript SPA with Tailwind and React Router. It has Login, Signup, For you, Search, Movie detail and Admin upload screens, and `src/lib/api.ts` holds the API client. The README says some screens still render seeded sample data and are not yet wired to endpoints. The README also describes a CSV upload for admins, but no upload route appears in the extracted API routes.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Python 3.12 (matches backend/Dockerfile)
- Node.js and npm (a recent version; Vite 6 and React 19 need Node 18+)
- PostgreSQL 16, either local or via Docker (docker-compose.yml provides a postgres:16-alpine service)
- Docker and Docker Compose (optional, for the database and for building the backend image)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. Start PostgreSQL: docker compose up -d db
2. Create a virtualenv in the backend (Playwright's config expects backend/.venv): cd backend && python -m venv .venv && source .venv/bin/activate
3. Install backend dependencies: pip install -r requirements.txt
4. Point the backend at the database (required, the app fails on import without it): export DATABASE_URL="postgresql+psycopg://app:<database-password>@localhost:5432/app" (use the user, database and password defined for the db service in docker-compose.yml)
5. Optional, create the first admin on startup: export BOOTSTRAP_ADMIN_EMAIL="<admin-email>" and export BOOTSTRAP_ADMIN_PASSWORD="<admin-password>". Optionally also set SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD to seed one viewer.
6. Install frontend dependencies: cd frontend && npm install
7. Optional: set VITE_API_BASE_URL to the backend URL when running the frontend. The code defaults it to an empty string, and the comment in api.ts says it falls back to the local backend.
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| backend dev | `cd backend && uvicorn app.main:app --reload` | Starts the FastAPI API on port 8000 with auto-reload. Migrations and seeding run on startup. Health check: GET /health. |
| frontend dev | `cd frontend && npm run dev` | Starts the Vite dev server for the React SPA. |
| frontend build | `cd frontend && npm run build` | Bundles the SPA with Vite. It does not typecheck. |
| frontend preview | `cd frontend && npm run preview` | Serves the built bundle locally. |
| frontend typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit, which the build does not run. |
| lint (frontend) | `cd frontend && npm run lint` | ESLint over the frontend. Use npm run lint:fix to apply fixes. |
| format (frontend) | `cd frontend && npm run format` | Prettier write. Use npm run format:check to only check. |
| lint (backend) | `cd backend && ruff check .` | Ruff lint. Use ruff format . to format. |
| backend image | `docker build -t movies-backend ./backend` | Builds the backend container (python:3.12-slim, runs uvicorn on port 8000 as an unprivileged user, with a /health healthcheck). |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer/` | Dev container configuration. |
| `.github/workflows/` | deploy.yml: on push to main, builds and pushes the API image to ECR and publishes the frontend build to AWS Amplify. |
| `.quorq/` | Quorq platform handoff/prepared metadata. |
| `docs/` | Project documentation (behaviour-rules.md). |
| `backend/app/` | FastAPI application: main.py (app, CORS, lifespan, /health), config.py, database.py, models.py, schemas.py, security.py, deps.py, bootstrap.py (seeding). |
| `backend/app/routers/` | One router per component: auth.py (signup, login, logout, me) and movies.py (list, detail, likes, for-you). |
| `backend/app/migrations/` | Alembic environment, runner and versions/ (0001_initial_schema.py). Schema changes go through migrations only. |
| `backend/app/data/` | sample_movies.json, the built-in sample catalog. |
| `backend/scripts/` | Helper scripts, e.g. check_connections.py. |
| `backend/tests/` | pytest suites: unit/ and integration/ (auth API, health, restart persistence, sample catalog). |
| `frontend/src/` | SPA source: App.tsx (shell and routes), main.tsx, index.css, plus lib/ and screens/. |
| `frontend/src/screens/` | One module per screen (Login, Signup, ForYou, Search, MovieDetail, AdminUpload) with Vitest tests beside them. |
| `frontend/src/lib/` | api.ts (fetch client, session token, ApiError), auth.ts, brand.ts, icons.tsx, navigate.ts, ui.tsx. |
| `frontend/e2e/` | Playwright acceptance specs (login, signup, example) and support/admin.ts. |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Schema changes only via Alembic migrations in backend/app/migrations/versions; any models.py change needs a matching migration. create_all is not used.
- Migrations and seeding run in the FastAPI lifespan on startup, not at import; the seeding is idempotent.
- One router per component that owns endpoints, included in main.py.
- Sessions are opaque bearer tokens (Authorization: Bearer <token>). Only the sha256 of the token is stored. CORS allows no credentials and permits only the origins in ALLOWED_ORIGINS.
- Emails are normalized to lowercase. Movies are unique by lowercased title (title_key) plus year. The movie listing limit is at most 100 per page.
- Backend dependencies, including test and lint tools, live in the single backend/requirements.txt. Ruff is the linter and formatter (ruff.toml).
- Frontend uses the '@' alias for src/, Tailwind with brand CSS variables, Prettier and ESLint. Component tests sit beside components. Vitest only collects src/**/*.test\|spec.ts(x), and e2e/ is left to Playwright.
- All API calls go through apiFetch in frontend/src/lib/api.ts, which sends the stored session token and calls a registered handler on a 401.
- The app must stay self-contained, with no outside services, APIs or downloads at build or run time.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend tests | `cd backend && pytest` | Runs unit and integration tests (testpaths = tests). Importing the app requires DATABASE_URL to be set and PostgreSQL to be reachable. |
| backend lint | `cd backend && ruff check .` | Static lint checks on the backend. |
| frontend unit tests | `cd frontend && npm test` | Runs Vitest component tests once (vitest run). |
| frontend e2e install | `cd frontend && npm run test:e2e:install` | Installs the Chromium browser for Playwright. |
| frontend e2e | `cd frontend && npm run test:e2e` | Runs Playwright specs from e2e/. Without E2E_BASE_URL it starts the backend from backend/.venv on port 8000 and builds and previews the frontend on port 4173. With E2E_BASE_URL set it targets that deployed URL. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| Backend or pytest fails on import with 'DATABASE_URL is not set'. | Export DATABASE_URL as a postgresql+psycopg:// SQLAlchemy URL before running uvicorn or pytest, e.g. postgresql+psycopg://app:<database-password>@localhost:5432/app. |
| Connection refused or the app cannot reach the database on startup. | Run docker compose up -d db and wait for the healthcheck (pg_isready) to pass. Confirm the host, port and credentials in DATABASE_URL match docker-compose.yml. Backend/scripts/check_connections.py is available for checking connections. |
| No admin account exists, so the Upload movies link never appears. | Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD before starting the backend. The admin is created on startup only if no user with that email exists. |
| Browser requests from the frontend are blocked by CORS. | Set ALLOWED_ORIGINS on the backend to include the frontend's origin, and set VITE_API_BASE_URL for the frontend build or dev server to the backend URL. |
| Everything redirects to /login or shows 'session expired'. | Sessions expire after 30 minutes without an authenticated request, and each login creates a new session. Log in again. |
| npm run build succeeds but npm run typecheck reports errors. | This is expected. The build does not typecheck, so fix the type errors reported by tsc --noEmit separately. |
| Playwright cannot start the backend (missing backend/.venv/bin/python). | Create and populate backend/.venv (python -m venv .venv, then pip install -r requirements.txt inside backend), or set E2E_BASE_URL to run against an already-running deployment. |
| Chromium crashes in a container when running e2e tests. | The Playwright config already passes --disable-dev-shm-usage. Also make sure the browser is installed with npm run test:e2e:install. |
| .github/workflows/deploy.yml contains a hard-coded API key value and account identifiers in its build environment. | Treat that key as exposed: rotate it and supply it through repository secrets instead of committing it to the workflow file. |
<!-- sdlc:auto:end troubleshooting -->
