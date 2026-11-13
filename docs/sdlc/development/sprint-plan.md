# Sprint Plan

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start sprints -->
## Sprint 1: Sprint 1

Self-contained deployment skeleton with PostgreSQL, working signup and login, and the sample catalog loaded on first start

Capacity: 20 points · Committed: 20

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-001 | Story | Sign up with email and password | 5 | backend-agent | US-007 |
| US-002 | Story | Log in and log out | 5 | backend-agent | US-001 |
| US-005 | Story | Sample catalog available after install | 5 | backend-agent | US-007 |
| US-007 | Story | Single deployable app with embedded database | 5 | devops-agent | — |

## Sprint 2: Sprint 2

First admin and role enforcement, in-house similarity engine, title search, likes and the movie detail page

Capacity: 20 points · Committed: 18

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-003 | Story | First admin account from server config | 3 | backend-agent | US-001 |
| US-004 | Story | No password reset or email verification | 1 | frontend-agent | US-002 |
| US-008 | Story | Search movies by title | 3 | frontend-agent | US-002, US-005 |
| US-009 | Story | Movie detail page | 3 | frontend-agent | US-008, US-013 |
| US-012 | Story | Similarity computed in-house | 5 | backend-agent | US-005 |
| US-013 | Story | Like and unlike movies | 3 | backend-agent | US-002, US-005 |

## Sprint 3: Sprint 3

Similar movies, For you recommendations with the no-likes prompt, and admin CSV upload with validation

Capacity: 20 points · Committed: 20

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-011 | Story | See similar movies ranked by similarity | 5 | backend-agent | US-012, US-009 |
| US-014 | Story | For you list from all likes | 5 | backend-agent | US-012, US-013 |
| US-015 | Story | Prompt when there are no likes | 2 | frontend-agent | US-014 |
| US-016 | Story | Upload movies from a CSV file | 5 | backend-agent | US-003, US-005, US-011 |
| US-017 | Story | Validate rows and handle duplicates | 3 | backend-agent | US-016 |

## Sprint 4: Sprint 4

Placeholder artwork, verified no-outside-dependency operation and setup documentation

Capacity: 20 points · Committed: 7

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-006 | Story | No outside dependencies at build or run time | 3 | devops-agent | US-007, US-010, US-016 |
| US-010 | Story | Generated placeholder artwork | 2 | frontend-agent | US-009 |
| US-018 | Story | Setup and usage guide | 2 | devops-agent | US-003, US-016 |

## Unscheduled

_Nothing unscheduled._
<!-- sdlc:auto:end sprints -->
