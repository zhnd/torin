# @torin/agent

AI analysis layer — uses Claude Agent SDK to analyze code in sandboxed environments.

## Responsibilities

- Run Claude Agent SDK `query()` with custom MCP sandbox tools
- Manage prompt templates (`src/prompts/`) for different task types
- Parse and validate structured agent responses
- Provide sandbox tools (bash, read_file, list_files) that delegate to the `Sandbox` interface

## Internal structure

```
src/
  prompts/              # Prompt templates per task type
    analyze-repository.ts
  tools/
    sandbox-tools.ts    # MCP tools wrapping Sandbox interface
  analyze.ts            # Repository analysis orchestration
  logger.ts             # Package-level Pino logger
```

## Dependencies

- `@torin/sandbox` — sandbox interface for code execution
- `@torin/domain` — shared types (AnalysisResult, etc.)
- `@torin/shared` — logger

## Key constraint

Agent operates exclusively through the `Sandbox` interface — it never has direct access to the host filesystem or shell. All code exploration happens inside the sandboxed environment. Model is configurable via `AGENT_MODEL` env var.
