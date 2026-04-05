# @torin/shared

Common utilities shared across all packages.

## Responsibilities

- Logger setup and configuration
- Config loading (env, files)
- Common error types and error handling patterns
- General-purpose helpers (id generation, date formatting, etc.)

## Dependencies

None (may depend on third-party libs, but no `@torin/*` packages).

## Key constraint

Must remain lightweight and free of domain logic. If something is specific to tasks, workflows, or agents, it belongs in the respective package, not here.
