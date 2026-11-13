<!-- sdlc:auto:start adr -->
# ADR-0001: Use React 19 for Frontend

Status: Accepted  
Date: 2026-11-13

## Context and Problem Statement

Which Frontend technology does the project use? Decided in architecture v1.

## Considered Options

- React 19
- Vue
- Svelte

## Decision Outcome

Chosen option: React 19, because Approved by the product owner. It covers search, detail, like buttons, For you and the admin upload screen. It builds to static files served by nginx on their own origin, with system fonts and generated SVG artwork, so nothing is fetched from outside.

## Consequences

The SPA keeps the session token in browser storage, so it is exposed to script injection. The app mitigates this by rendering no raw HTML, serving only its own scripts and keeping session lifetime short. Client-side routing needs a fallback rule on nginx.
<!-- sdlc:auto:end adr -->