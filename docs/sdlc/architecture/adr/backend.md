<!-- sdlc:auto:start adr -->
# ADR-0002: Use FastAPI 0.115 for Backend

Status: Accepted  
Date: 2026-11-13

## Context and Problem Statement

Which Backend technology does the project use? Decided in architecture v1.

## Considered Options

- FastAPI 0.115
- Django
- Flask

## Decision Outcome

Chosen option: FastAPI 0.115, because Approved by the product owner. It hosts the auth, movie, like and upload routers and the in-process TF-IDF and cosine engine. At about 5,000 movies the sparse index sits comfortably in memory.

## Consequences

The in-memory index is per process, so the API runs as a single worker and rebuilds the index after uploads. This is fine for the stated scale but would need shared state to scale horizontally.
<!-- sdlc:auto:end adr -->