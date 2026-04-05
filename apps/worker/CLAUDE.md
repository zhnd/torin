# @torin/worker

Temporal worker process — registers and runs workflows and activities.

## Responsibilities

- Start Temporal worker and connect to Temporal server
- Register all workflows and activities from `@torin/workflow`
- Run as a standalone process, independently scalable from the API server

## Dependencies

- `@torin/workflow` — workflow and activity definitions
- `@torin/agent` — used within activities
- `@torin/domain` — shared types
- `@torin/shared` — utilities

## Key constraint

This is a long-running process, not an HTTP server. It must be deployable and scalable independently from `@torin/server`.
