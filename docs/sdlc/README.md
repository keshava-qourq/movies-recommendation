# Movies recommendation — SDLC Documentation

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start overview -->
I want a movie recommendation web app called WatchNext.

A user searches for a movie they liked and the app shows similar movies
they might enjoy, using cosine similarity on the movie's plot, genres,
director and cast. Users can like movies and get a "For you" list based
on everything they liked.

Users sign up and log in with email and password, so their likes are
saved to their account. There are two roles: viewer and admin.
Only admins can upload more movies as a CSV file. The first admin account
is created from the server config.

The app must be fully self-contained: it must not call or depend on any
outside service, API or download, at build time or at run time. That means
no movie APIs, no poster images from the web, no email sending, no
third-party login, and no AI or LLM calls. Ship a built-in sample of about
50 well-known movies with the app, so it works right after install.

**Documentation version:** v7
<!-- sdlc:auto:end overview -->

## Contents

<!-- sdlc:auto:start contents -->
| Document | State |
|---|---|
| [Requirements](requirements/README.md) | v1 approved |
| [Architecture](architecture/README.md) | 23 entries |
| [Planning](planning/README.md) | 7 entries |
| [Development](development/README.md) | 4 entries |
| [Testing](testing/README.md) | 4 entries |
| [Deployment](deployment/README.md) | 1 entry |
| [Maintenance](maintenance/README.md) | 0 entries |
| [Data model](architecture/data-model.md) | generated |
| [API (OpenAPI)](architecture/api/openapi.yaml) | generated |
| [Decisions (ADRs)](architecture/adr/README.md) | 5 decisions |
| [Sprint plan](development/sprint-plan.md) | 4 sprints |
| [Developer guide](development/developer-guide.md) | generated |
| [API reference](development/api-reference.md) | 12 routes |
| [Test report](testing/test-report.md) | not run yet |
| [Tests](testing/test-cases.md) | 77 tests |
| [Deployment guide](deployment/deployment-guide.md) | deployed |
| [Runbook](deployment/runbook.md) | deployed |
| [Release notes](deployment/release-notes.md) | 3 releases |
| [Traceability matrix](traceability-matrix.md) | 18 requirements |
| [Changelog](CHANGELOG.md) | 7 versions |
<!-- sdlc:auto:end contents -->
