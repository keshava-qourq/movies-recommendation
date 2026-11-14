# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `bb848d0` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
WatchNext is a self-contained movie recommendation app in one repository with two applications. The backend/ directory is a FastAPI service (SQLAlchemy 2, Alembic migrations, PostgreSQL via psycopg). It provides email/password signup and login with opaque server-side sessions sent as a Bearer token, and viewer and admin roles. It also provides movie search and detail, likes, a cosine-similarity 'similar movies' and 'For you' ranking (app/similarity.py), and an admin-only CSV movie upload. On startup it runs migrations and seeds the configured users and a bundled sample catalog of about 50 movies. The frontend/ directory is a Vite + React 19 + TypeScript SPA (React Router, Tailwind 4) with screens for login, signup, For you, search, movie detail and admin upload. Its API client (src/lib/api.ts) reads the API base URL from VITE_API_BASE_URL. The README notes that some screens were generated on seeded sample data, with wiring to real endpoints still in progress. CI (.github/workflows/deploy.yml) builds the backend Docker image and deploys the frontend build.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Python 3.12 (the backend Dockerfile uses python:3.12-slim)
- Node.js and npm (React 19, Vite 6, Vitest 2; the Node version is not pinned in the manifests)
- PostgreSQL 16, or Docker with Docker Compose to run the db service from docker-compose.yml
- A Chromium browser installed through Playwright, only for the end-to-end tests
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. Start PostgreSQL from the repo root: docker compose up -d db
2. Create and activate a backend virtualenv: cd backend && python -m venv .venv && source .venv/bin/activate
3. Install backend dependencies: pip install -r requirements.txt
4. Point the backend at your database (required; the app refuses to start without it): export DATABASE_URL="<database-url>"  (a postgresql+psycopg:// SQLAlchemy URL)
5. Optional, to create the first admin on startup: export BOOTSTRAP_ADMIN_EMAIL="<admin-email>" and export BOOTSTRAP_ADMIN_PASSWORD="<admin-password>". SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD optionally seed one viewer.
6. Start the API (migrations and sample-movie seeding run on startup): uvicorn app.main:app --reload
7. In a second terminal install frontend dependencies: cd frontend && npm install
8. Start the frontend, pointing it at the API: VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
9. If the browser blocks API calls with a CORS error, set ALLOWED_ORIGINS on the backend to the frontend's origin and restart it. See .env.example and ENVIRONMENT.md for the environment variables.
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| db | `docker compose up -d db` | Starts the PostgreSQL 16 container defined in docker-compose.yml. |
| backend dev | `cd backend && uvicorn app.main:app --reload` | Runs the FastAPI API with auto-reload on port 8000. Health check at GET /health. |
| frontend dev | `cd frontend && npm run dev` | Starts the Vite dev server for the React SPA. |
| frontend build | `cd frontend && npm run build` | Bundles the app with Vite. It does not typecheck. |
| frontend preview | `cd frontend && npm run preview` | Serves the built bundle locally. |
| typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit. The README says the build does not run it, so run it separately. |
| lint | `cd frontend && npm run lint` | Runs ESLint over the frontend. Use npm run lint:fix to apply automatic fixes. |
| format | `cd frontend && npm run format` | Formats the frontend with Prettier. Use npm run format:check to only check. |
| backend lint | `cd backend && ruff check .` | Lints the backend with Ruff. Use ruff format . to format. |
| docker build | `docker build -t movies-api ./backend` | Builds the backend image (runs uvicorn on port 8000 as an unprivileged user, with a /health healthcheck). |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer/` | Dev container configuration. |
| `.github/workflows/` | deploy.yml: builds and pushes the API image and deploys the frontend build on pushes to main. |
| `.quorq/` | Quorq platform handoff metadata (handoff.json, prepared.json). |
| `docs/` | Project documentation (behaviour-rules.md). |
| `backend/app/` | FastAPI application: main.py, config, database, models, schemas, security, deps, bootstrap seeding and similarity. |
| `backend/app/routers/` | API routers: auth (signup, login, logout, me), admin (CSV upload) and movies (list, detail, similar, likes, for-you). |
| `backend/app/migrations/` | Alembic environment, the startup runner and versioned migrations (0001_initial_schema.py). |
| `backend/app/data/` | sample_movies.json, the built-in sample catalog seeded on first start. |
| `backend/scripts/` | Helper scripts (check_connections.py). |
| `backend/tests/` | pytest suites: unit/ and integration/, with shared fixtures in conftest.py. |
| `frontend/src/` | React app: App.tsx (route table and shell), main.tsx, index.css and test setup. |
| `frontend/src/screens/` | One module per screen (Login, Signup, ForYou, Search, MovieDetail, AdminUpload) with Vitest tests beside them. |
| `frontend/src/lib/` | api.ts (fetch client and session token), auth.ts, brand.ts, icons.tsx, navigate.ts and ui.tsx. |
| `frontend/e2e/` | Playwright acceptance specs (login, signup, search, likes, first admin and others) plus support helpers. |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Schema changes go only through Alembic migrations in backend/app/migrations/versions. Any change to models.py needs a matching migration. create_all is not used.
- One FastAPI router per component that owns endpoints, registered in app/main.py. Migrations and seeding run in the lifespan startup, not at import.
- Database sessions come from the get_db dependency, one per request. DATABASE_URL is required.
- Sessions are opaque tokens sent as 'Authorization: Bearer <token>'. Only the sha256 of the token is stored, and CORS credentials are disallowed.
- Emails are stored lowercased. A movie is unique by lowercased trimmed title plus year (title_key, year).
- Admin routes are protected with the require_admin dependency. All movie routes require a signed-in user.
- Backend style is enforced with Ruff (backend/ruff.toml). Python dependencies are pinned in requirements.txt, with test dependencies kept in the same file.
- Frontend uses the '@' alias for src/, React function components, Tailwind with brand CSS variables, ESLint and Prettier. Vitest component tests sit beside the components.
- All HTTP calls from the frontend go through apiFetch in src/lib/api.ts, which attaches the session token and triggers the unauthorized handler on a 401 with a token.
- The app must stay self-contained: no outside services, APIs or downloads at build time or run time.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend tests | `cd backend && pytest` | Runs the unit and integration suites under backend/tests. The integration tests presumably need a reachable PostgreSQL (DATABASE_URL is required to import the app). |
| backend lint | `cd backend && ruff check .` | Static checks for the backend. |
| frontend unit tests | `cd frontend && npm test` | Runs Vitest component tests from src/ (jsdom). |
| frontend lint | `cd frontend && npm run lint` | ESLint gate for the frontend. |
| e2e install browser | `cd frontend && npm run test:e2e:install` | Installs the Chromium browser used by Playwright. |
| e2e | `cd frontend && npm run test:e2e` | Runs the Playwright specs in e2e/. Without E2E_BASE_URL it starts the backend from backend/.venv and builds and serves the frontend on port 4173. With E2E_BASE_URL set it tests that deployed URL. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| Backend fails at startup with 'DATABASE_URL is not set'. | Export DATABASE_URL as a postgresql+psycopg:// SQLAlchemy URL for a running PostgreSQL (for example the db service from docker compose up -d db) before running uvicorn or pytest. |
| Backend cannot connect to the database. | Check that the db container is healthy (docker compose ps) and that the host, port and credentials in DATABASE_URL match it. |
| pytest cannot import 'app'. | Run pytest from the backend/ directory, where pytest.ini sets pythonpath to '.'. |
| Browser shows CORS errors or requests go to the wrong host. | Set VITE_API_BASE_URL to the API address when starting or building the frontend. Set ALLOWED_ORIGINS on the backend to the frontend's origin. Sessions use a Bearer header, not cookies. |
| npm run build succeeds but TypeScript errors appear later. | The build does not typecheck. Run npm run typecheck and fix the reported errors. |
| Playwright e2e cannot start the backend (missing backend/.venv/bin/python). | Create backend/.venv and install requirements.txt into it, or set E2E_BASE_URL to run against an already running deployment. |
| No admin account exists or the Upload movies menu item is missing. | Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD before starting the backend. The admin is created at startup if that email does not exist. Only admins see the upload page. |
| Suddenly redirected to the login page. | Sessions expire after 30 minutes without an authenticated request. Log in again. |
| CSV upload is rejected. | Use a UTF-8 CSV under 5 MB with the header columns title, year, genres, director, cast and plot. Genres and cast are separated with '\|'. The response lists skipped duplicates and rejected rows by row number. |
<!-- sdlc:auto:end troubleshooting -->
