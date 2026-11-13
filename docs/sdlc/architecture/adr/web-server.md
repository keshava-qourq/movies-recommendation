<!-- sdlc:auto:start adr -->
# ADR-0005: Use nginx for Web server

Status: Accepted  
Date: 2026-11-13

## Context and Problem Statement

Which Web server technology does the project use? Decided in architecture v1.

## Considered Options

- nginx
- Caddy
- FastAPI StaticFiles

## Decision Outcome

Chosen option: nginx, because The platform requires the SPA and API on two separate origins. The approved stack cannot give two origins from one FastAPI process, so nginx serves the static build on one hostname and proxies the API hostname. Caddy was rejected because its automatic certificate issuance calls outside services.

## Consequences

It is one more container to configure, but it is a small, static configuration.
<!-- sdlc:auto:end adr -->