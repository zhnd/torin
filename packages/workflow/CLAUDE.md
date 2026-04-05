# @torin/workflow

Temporal workflow definitions, activities, and client utilities.

## Responsibilities

- Define Temporal workflows (control flow, state transitions, signals/queries)
- Define activities (side-effect execution: call agent, run tools, collect artifacts)
- Expose a Temporal client wrapper for server to start/query/signal workflows
- Handle retry policies and failure recovery within workflows

## Internal structure

```
src/
  workflows/    # Temporal workflow definitions
  activities/   # Activity implementations (where side effects happen)
  client/       # Temporal client wrapper for external callers
```

## Dependencies

- `@torin/agent` — called from within activities
- `@torin/domain` — shared types
- `@torin/shared` — utilities

## Key constraint

Workflow code runs in a Temporal sandbox — it must be deterministic and cannot do I/O directly. All I/O goes through activities.
