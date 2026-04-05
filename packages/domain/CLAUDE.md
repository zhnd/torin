# @torin/domain

Core domain types — the shared type contracts of the Torin system.

## Responsibilities

- Define shared types used across packages
- Current types: `TaskStatus`, `AnalyzeRepositoryInput`, `AnalysisResult`

## Dependencies

None. This is a leaf package — it must not depend on any other `@torin/*` package.

## Key constraint

Pure types and constants only. No runtime logic, no I/O, no side effects. If it imports something with behavior, it belongs elsewhere.
