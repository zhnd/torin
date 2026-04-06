# @torin/web

Frontend application for task visibility and control.

## Responsibilities

- Task list with filtering, sorting, pagination (TanStack Table)
- Task detail view with tabs (Overview, Timeline, Logs, Diff, Cost, Replay)
- Project management (CRUD)
- Authentication (login, register via better-auth)

## Tech stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS v4
- Apollo Client (GraphQL data fetching)
- GraphQL Codegen (client-preset)
- TanStack React Table (data tables)
- Radix UI + shadcn/ui (component primitives)
- React Hook Form + Zod (form validation)

## Internal structure

```
src/
  app/                    # Next.js App Router pages (thin — delegate to modules)
  components/
    ui/                   # shadcn/ui primitives (DO NOT add custom components here)
    common/               # Reusable components (empty-state, status-badge, etc.)
    data-table/           # Generic DataTable component (TanStack Table + shadcn Table)
    layout/               # App shell, header, sidebar
  libs/
    apollo/               # Apollo Client provider and configuration
    auth-client.ts        # better-auth client
  modules/{feature}/      # Feature modules (page components, forms, GraphQL, services)
  utils/                  # Utilities (cn.ts)
```

## Conventions

- **`components/ui/`** is reserved for shadcn/ui — do not add custom components there
- **Feature modules** live in `modules/` — each module owns its page components, sub-components, GraphQL operations, and service hooks
- **Shared components** go in `components/common/` or `components/{name}/`
- **App Router pages** are thin wrappers that import from modules

## Dependencies

- `@torin/domain` — shared types (TaskStatus, ExecutionStatus, etc.)
- `@torin/server` — all data via GraphQL API (no direct package imports at runtime)

## Key constraint

Web never talks to Temporal or agent directly. All operations go through the server GraphQL API.
