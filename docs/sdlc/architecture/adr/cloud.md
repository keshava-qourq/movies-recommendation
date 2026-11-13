<!-- sdlc:auto:start adr -->
# ADR-0004: Use AWS for Cloud

Status: Accepted  
Date: 2026-11-13

## Context and Problem Statement

Which Cloud technology does the project use? Decided in architecture v1.

## Considered Options

- AWS
- Any other VPS provider

## Decision Outcome

Chosen option: AWS, because Approved by the product owner. One EC2 instance hosts nginx, the API and PostgreSQL, and nothing else on AWS is needed at runtime, which keeps the app self-contained.

## Consequences

A single instance means no high availability, and backups of the database volume are the operator's responsibility. This is acceptable for the stated scale.
<!-- sdlc:auto:end adr -->