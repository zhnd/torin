# @torin/agent

AI/LLM integration layer — the "thinking" part of Torin.

## Responsibilities

- Encapsulate LLM API calls (prompt construction, response parsing)
- Implement planning: break tasks into executable steps
- Provide strategy patterns for different task types (bugfix, implementation, analysis)
- Manage prompt templates and context assembly

## Dependencies

- `@torin/domain` — shared types
- `@torin/shared` — utilities

## Key constraint

Agent produces plans and decisions but does not execute them. Execution is the responsibility of workflow activities. Agent has no direct access to repos, shells, or external systems — it only returns structured instructions.
