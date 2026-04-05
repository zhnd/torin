# @torin/web

Frontend application for task visibility and control.

## Responsibilities

- Task creation form (submit repository URL for analysis)
- Task detail view with status polling and result display
- Real-time status updates via Apollo Client polling

## Tech stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS v4
- Apollo Client (GraphQL)
- GraphQL Codegen (client-preset)

## Dependencies

- `@torin/server` — all data via GraphQL API (no direct package imports at runtime)

## Key constraint

Web never talks to Temporal or agent directly. All operations go through the server GraphQL API.
