# @torin/domain

Core domain types — the unified language of the Torin system.

## Responsibilities

- Define all shared types: Task, TaskStatus, ExecutionStep, RunContext, Artifact, etc.
- Provide type-level contracts that all other packages depend on
- Ensure a single source of truth for domain models across server, worker, web, and workflow

## Dependencies

None. This is a leaf package — it must not depend on any other `@torin/*` package.

## Key constraint

Pure types and constants only. No runtime logic, no I/O, no side effects. If it imports something with behavior, it belongs elsewhere.
