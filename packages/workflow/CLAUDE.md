# @torin/workflow

Temporal workflow definitions, activities, and client utilities.

## Responsibilities

- Define Temporal workflows (control flow, state transitions)
- Define activities split by single responsibility with independent timeouts
- Expose a Temporal client wrapper for server to start/query workflows
- Handle retry policies and failure recovery

## Internal structure

```
src/
  workflows/
    analyze-repository.ts   # Orchestrates: create sandbox → analyze → destroy
  activities/
    create-sandbox.ts       # Create Docker sandbox, clone repo (5 min timeout)
    analyze-code.ts         # Run agent analysis (10 min timeout, 2 retries)
    destroy-sandbox.ts      # Cleanup container (1 min timeout)
    update-task.ts          # Update Task status in DB (1 min timeout)
  client/
    index.ts                # Temporal client wrapper, TASK_QUEUE constant
  logger.ts                 # Package-level Pino logger
```

## Dependencies

- `@torin/agent` — called from analyzeCode activity
- `@torin/sandbox` — create/connect/destroy sandboxes
- `@torin/database` — update Task records
- `@torin/domain` — shared types
- `@torin/shared` — logger

## Key constraint

Workflow code runs in a Temporal sandbox — it must be deterministic and cannot do I/O directly. All I/O goes through activities.
