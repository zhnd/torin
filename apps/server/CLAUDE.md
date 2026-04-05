# @torin/server

HTTP API entry point for the Torin system.

## Responsibilities

- Expose REST API for task creation, querying, and control
- Validate and transform incoming requests
- Delegate task execution to Temporal via `@torin/workflow` client
- Serve task status and execution history to `@torin/web`

## Dependencies

- `@torin/workflow` — start and query workflows
- `@torin/domain` — shared types
- `@torin/shared` — utilities

## Key constraint

This package does NOT execute tasks directly. All execution goes through Temporal workflows. The server is a thin API layer.
