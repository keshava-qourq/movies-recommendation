<!-- sdlc:auto:start adr -->
# ADR-0003: Use PostgreSQL 16 for Database

Status: Accepted  
Date: 2026-11-13

## Context and Problem Statement

Which Database technology does the project use? Decided in architecture v1.

## Considered Options

- PostgreSQL 16
- SQLite

## Decision Outcome

Chosen option: PostgreSQL 16, because Approved by the product owner in place of the SQLite the stories assumed. It runs on the same instance and calls no outside service. It stores users, sessions, movies and likes, with unique constraints that make signup, seeding, uploads and likes idempotent. Its array columns hold genres and cast.

## Consequences

It is a separate container rather than an embedded file, so the setup guide must cover starting it. This is handled by Docker Compose.
<!-- sdlc:auto:end adr -->