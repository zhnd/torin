# @torin/worker

Temporal worker process — registers and runs workflows and activities.

## Responsibilities

- Start Temporal worker and connect to Temporal server
- Register all workflows and activities from `@torin/workflow`
- Run as a standalone process, independently scalable from the API server

## Dependencies

- `@torin/workflow` — workflow and activity definitions (activities are imported directly, workflows loaded via file path)
- `@torin/shared` — logger

## Key constraint

This is a long-running process, not an HTTP server. It must be deployable and scalable independently from `@torin/server`. Requires `DATABASE_URL` (activities use Prisma) and Docker daemon access (sandbox creation).
