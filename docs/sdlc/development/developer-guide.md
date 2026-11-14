# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `068168c` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
WatchNext is a self-contained movie recommendation app in one repository with two apps. The backend is a FastAPI service (SQLAlchemy 2, Alembic migrations, PostgreSQL via psycopg). It handles email/password signup and login with opaque Bearer session tokens, and has viewer and admin roles. It lists, searches and shows movies, and supports likes. It ranks similar movies and builds a per-user 'For you' list using in-memory cosine similarity over plot, genres, director and cast. Admins can upload movies as CSV. On startup it runs migrations, seeds the configured users and loads a bundled sample catalog (backend/app/data/sample_movies.json). The frontend is a Vite + React 19 + TypeScript SPA (react-router, Tailwind) with Login, Signup, For you, Search, Movie detail and Admin upload screens. The frontend README says the screens were generated on seeded sample data, but App.tsx already uses apiFetch for /auth/me and session handling. The code does not call any outside service.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Python 3.12 (the backend Dockerfile uses python:3.12-slim)
- Node.js and npm (a recent LTS; React 19, Vite 6 and Vitest 2 are used)
- PostgreSQL 16 (docker-compose.yml provides one), so Docker with Compose is the easiest route
- Docker (optional, for the database and for building the backend image)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. Start PostgreSQL from the repo root: docker compose up -d db
2. Create a backend virtualenv: cd backend && python -m venv .venv && source .venv/bin/activate
3. Install backend dependencies: pip install -r requirements.txt
4. Set the database URL (a postgresql+psycopg:// SQLAlchemy URL; the user, password and database name come from the db service in docker-compose.yml): export DATABASE_URL="<database-url>"
5. Optionally set the first admin, which is created on startup if that email does not exist: export BOOTSTRAP_ADMIN_EMAIL="<admin-email>" and export BOOTSTRAP_ADMIN_PASSWORD="<admin-password>"
6. Optionally allow the frontend origin for CORS: export ALLOWED_ORIGINS="<frontend-origin>" (CORS_ALLOWED_ORIGINS overrides it). Check backend/app/config.py for the expected format.
7. Start the API (migrations and seeding run on startup): uvicorn app.main:app --reload
8. In a second terminal, install frontend dependencies: cd frontend && npm install
9. Start the frontend against the local API: VITE_API_BASE_URL=http://localhost:8000 npm run dev
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| db | `docker compose up -d db` | Starts the local PostgreSQL 16 container defined in docker-compose.yml. |
| backend dev | `cd backend && uvicorn app.main:app --reload` | Runs the FastAPI app with auto-reload on port 8000. Requires DATABASE_URL. Health check: GET /health. |
| backend (single worker) | `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000` | The same command the Dockerfile uses. Keep one worker, because the similarity index is in memory. |
| backend image | `docker build -t movies-backend ./backend` | Builds the backend container image from backend/Dockerfile. |
| frontend dev | `cd frontend && npm run dev` | Starts the Vite dev server. Set VITE_API_BASE_URL to point it at the API. |
| frontend build | `cd frontend && npm run build` | Bundles the SPA with vite build. This does not typecheck. |
| frontend preview | `cd frontend && npm run preview` | Serves the built bundle locally. |
| typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit. It is optional and not part of the build. |
| format | `cd frontend && npm run format` | Formats the frontend with Prettier. Use npm run format:check to only check. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer` | Dev container configuration. |
| `.github/workflows` | deploy.yml: on push to main it builds and pushes the API image to ECR and deploys the frontend build to AWS Amplify. |
| `.quorq` | Platform handoff and preparation metadata (handoff.json, prepared.json). |
| `docs` | Project documentation (behaviour-rules.md). |
| `backend/app` | FastAPI application. main.py is the entry point, with config, database, models, schemas, security, deps, similarity and bootstrap (seeding) modules. routers/ holds auth, movies and admin. migrations/ holds Alembic (env, runner, versions/0001_initial_schema.py). data/ holds sample_movies.json. |
| `backend/scripts` | Utility scripts (check_connections.py). |
| `backend/tests` | pytest suites: unit/ for isolated logic and integration/ for API, health, similarity, upload, persistence and self-containment checks. |
| `frontend/src` | SPA source. App.tsx has the shell, route guards and route table, and main.tsx is the entry point. lib/ has api.ts (fetch client, session token), auth.ts, brand, icons and ui. screens/ has one module per screen with its Vitest test beside it. |
| `frontend/e2e` | Playwright acceptance specs (login, signup, search, likes, for-you, similar movies, admin upload, first admin and more). |
| `frontend/coverage` | Generated coverage output. |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Schema changes go only through Alembic migrations in backend/app/migrations/versions. Do not use create_all; any change to models.py needs a matching migration.
- One FastAPI router per feature area (auth, movies, admin). Routers use Annotated dependencies, and movies and admin enforce authentication (get_current_user, require_admin) at router level.
- Migrations and seeding run in the FastAPI lifespan on startup, not at import. Importing the app never opens a connection, but app/database.py raises at import if DATABASE_URL is unset.
- Sessions are opaque Bearer tokens (only the sha256 hash is stored) and expire after 30 minutes of inactivity. CORS allows no credentials or cookies.
- Emails are stored lowercased. A movie is unique by lowercased title (title_key) plus year. CSV columns are title, year, genres, director, cast and plot, with genres and cast separated by '\|'.
- The API is self-contained: no outside services, APIs or downloads at build or run time.
- Frontend calls the API through apiFetch in src/lib/api.ts. It sends the Bearer token from localStorage, joins the base URL with exactly one slash, and calls the unauthorized handler on a 401.
- Frontend uses the '@' alias for src/, one module per screen in src/screens, and component tests beside the components (*.test.tsx).
- Backend lint and format use ruff (backend/ruff.toml). Frontend uses ESLint and Prettier.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend tests | `cd backend && pytest` | Runs unit and integration tests from backend/tests. DATABASE_URL must point at a reachable PostgreSQL. |
| backend lint | `cd backend && ruff check .` | Lints the backend code. |
| backend format | `cd backend && ruff format .` | Formats the backend code. |
| frontend unit tests | `cd frontend && npm test` | Runs Vitest (jsdom) component tests under src/. |
| frontend lint | `cd frontend && npm run lint` | Runs ESLint over the frontend. Use npm run lint:fix to apply fixes. |
| e2e browser install | `cd frontend && npm run test:e2e:install` | Installs the Chromium browser used by Playwright. |
| e2e tests | `cd frontend && npm run test:e2e` | Runs the Playwright specs in e2e/. With E2E_BASE_URL set they run against that URL. Otherwise Playwright starts the backend from backend/.venv on port 8000 and a built preview on port 4173. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| Backend fails at startup with 'DATABASE_URL is not set'. | Export DATABASE_URL as a postgresql+psycopg:// SQLAlchemy URL for your database (for example the db service from docker-compose.yml) before running uvicorn or pytest. |
| Connection refused or the backend cannot reach Postgres. | Run docker compose up -d db and wait for its healthcheck to pass. Confirm the host and port in DATABASE_URL match the published port 5432. |
| The frontend loads but API calls fail or go to the wrong host. | VITE_API_BASE_URL defaults to an empty string, so requests go to the frontend's own origin. Start the dev server with VITE_API_BASE_URL=http://localhost:8000 npm run dev. |
| Browser requests are blocked by CORS. | Set ALLOWED_ORIGINS (or CORS_ALLOWED_ORIGINS) on the backend to the frontend's origin and restart it. Only that origin is allowed. |
| No admin account, so the Upload movies menu is missing. | Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD before starting the backend. The admin is created on startup only if no user with that email exists. |
| Playwright cannot start the backend (backend/.venv/bin/python not found). | Create backend/.venv and install requirements.txt into it, or set E2E_BASE_URL to run against an already running deployment. |
| npm run build succeeds but tsc reports type errors. | The build does not typecheck. Run npm run typecheck and fix the reported errors, typically untyped useState({}) values. |
| Similar or For you results look stale or inconsistent when running several API workers. | The similarity index is held in memory, so run a single uvicorn worker, as the README and Dockerfile do. |
<!-- sdlc:auto:end troubleshooting -->
