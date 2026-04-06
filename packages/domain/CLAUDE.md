# @torin/domain

Core domain types — the shared type contracts of the Torin system.

## Responsibilities

- Define shared types and constants used across packages
- Each domain area lives in its own file, re-exported from `index.ts`

## Internal structure

```
src/
  task.ts       # TaskStatus, TaskStage, StageStatus, ExecutionStatus, TaskBadge, TASK_STAGES
  workflow.ts   # AnalyzeRepositoryInput, AnalysisResult
  log.ts        # LogLevel, EventLevel
  index.ts      # Re-exports all modules
```

## Conventions

- One file per domain area — group related types together
- All exports go through `index.ts` so consumers import from `@torin/domain`
- When adding new types, place them in the appropriate domain file or create a new one

## Dependencies

None. This is a leaf package — it must not depend on any other `@torin/*` package.

## Key constraint

Pure types and constants only. No runtime logic, no I/O, no side effects. If it imports something with behavior, it belongs elsewhere.
