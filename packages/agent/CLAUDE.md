# @torin/agent

AI analysis layer — runs Claude Agent SDK queries against sandboxed code.

## Responsibilities

- Expose one function per agent (analyzeRepository, analyzeDefect, reproduceDefect, implementResolution) that takes a `Sandbox` and returns a structured result
- Own the prompt templates that encode each agent's role + output contract
- Provide a shared agent runtime that handles query loop, JSON parsing, observability, and tool gating uniformly
- Expose sandbox operations to the agent as an MCP server — every file/shell action flows through `Sandbox`, never the host filesystem

## Internal structure

```
src/
  agents/                           # one folder per agent
    analyze-repository/
      index.ts                      # function body (~20 lines via runAgent)
      prompts.ts                    # system + user prompt
    analyze-defect/
      index.ts
      prompts.ts
    reproduce-defect/
      index.ts                      # dispatches mode by analysis signals
      prompts.ts                    # 3 mode-specific system prompts
    implement-resolution/
      index.ts
      prompts.ts
  driver/                           # agent invocation layer — wraps one SDK query
    run-agent.ts                    # generic query wrapper; returns { result, observation }
    observer.ts                     # AgentObserver — maps SDK events → torin ObservedEvent[]
    parse-json.ts                   # parseAgentJson<T>(raw, schema) — zod-validated output decoder
  tools/                            # tools the agent can call (MCP server + permission gate)
    sandbox-server.ts               # createSandboxMcpServer(sandbox) — the 4 sandbox tools
    tool-config.ts                  # SANDBOX_READ_TOOLS, SANDBOX_WRITE_TOOLS, sandboxOnlyToolConfig
  logger.ts
  index.ts                          # public re-exports only
```

## Adding a new agent

1. Define the output schema in `@torin/domain/agent-outputs/<name>.ts` (zod + `z.infer`)
2. Create `src/agents/<name>/prompts.ts` with the system + user prompt builders
3. Create `src/agents/<name>/index.ts` that imports the schema from `@torin/domain` and calls `runAgent<Result>({ schema, ... })` — usually 15–25 lines
4. Re-export the function from `src/index.ts`

The `runAgent` helper handles: model resolution, query loop, observer wiring, JSON extraction + schema validation, logging. Don't duplicate it.

Rule: `prompts.ts` contains prompt strings only (no schema). The contract
lives in `@torin/domain/agent-outputs/` so consumers (workflow/server/web)
share the same source of truth as the producer.

## Tool gating

Agents must ONLY use sandbox MCP tools. The Claude Agent SDK ships built-in tools (Bash, Read, Grep, Glob, Write, Edit) that read the **host** filesystem — exactly what we don't want. `sandboxOnlyToolConfig()` returns an `allowedTools` + `canUseTool` pair that programmatically denies anything outside the MCP namespace. Every agent call must spread this config into `queryOptions`.

Two presets are exported:
- `SANDBOX_READ_TOOLS` — bash + read + list (for analysis agents)
- `SANDBOX_WRITE_TOOLS` — adds write (for reproduce + implement)

## Dependencies

- `@torin/sandbox` — sandbox interface for code execution
- `@torin/domain` — shared types (DefectAnalysis, ResolutionResult, etc.)
- `@torin/shared` — logger

## Key constraint

Agent operates exclusively through the `Sandbox` interface — it never has direct access to the host filesystem or shell. All code exploration happens inside the sandboxed environment. Model is configurable via `AGENT_MODEL` env var (default `claude-sonnet-4-6`).
