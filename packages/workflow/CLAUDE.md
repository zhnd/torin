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
    fix-bug.ts              # Orchestrates: analyze → HITL → implement → PR
  activities/
    create-sandbox.ts       # Create Docker sandbox, clone repo
    analyze-code.ts         # Agent-driven repository analysis
    analyze-bug.ts          # Agent-driven bug analysis
    implement-fix.ts        # Agent-driven fix implementation
    destroy-sandbox.ts      # Cleanup container
    push-branch.ts          # git push from sandbox
    create-pull-request.ts  # Open PR via GitHub API
    add-pr-review-comments.ts
    save-task-events.ts     # Persist observation events
    update-task.ts          # Update Task status in DB
  client/
    index.ts                # TASK_QUEUE + SANDBOX_TASK_QUEUE + client factory
  logger.ts                 # Package-level Pino logger
```

## Two task queues (host-safety pattern)

- `TASK_QUEUE` (`torin-main`) — workflows + lightweight activities (DB, GitHub API). High concurrency.
- `SANDBOX_TASK_QUEUE` (`torin-sandbox-heavy`) — every activity that touches a Docker container or drives the agent. Worker concurrency is capped by `SANDBOX_CONCURRENCY` so the host never runs more than N containers at once; overflow queues on the Temporal server.

Workflows route calls via three `proxyActivities` groups:

- `main` — default queue, 2 min timeout
- `sandboxInfra` — sandbox queue, 5 min timeout (create/destroy/push)
- `sandboxAgent` — sandbox queue, 10–15 min timeout (analyze/implement)

When adding a new activity: if it connects to a sandbox (even briefly), put it on `SANDBOX_TASK_QUEUE`. Otherwise `TASK_QUEUE`.

## Dependencies

- `@torin/agent` — called from agent-driven activities
- `@torin/sandbox` — create/connect/destroy sandboxes
- `@torin/database` — update Task records
- `@torin/domain` — shared types
- `@torin/shared` — logger

## Key constraint

Workflow code runs in a Temporal sandbox — it must be deterministic and cannot do I/O directly. All I/O goes through activities.
