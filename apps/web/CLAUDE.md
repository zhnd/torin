# @torin/web

Frontend application for task visibility and control.

## Responsibilities

- Display task list, status, and execution progress
- Show step-level logs and artifacts
- Provide controls for human-in-the-loop decisions (approve, reject, retry)
- Real-time updates on running workflows

## Dependencies

- `@torin/server` — all data via HTTP API (no direct package imports at runtime)
- `@torin/domain` — shared types for type safety

## Key constraint

Web never talks to Temporal or agent directly. All operations go through the server API.
