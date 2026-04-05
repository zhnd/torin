# @torin/sandbox

Isolated code execution environment for the Torin system.

## Responsibilities

- Define a unified `Sandbox` interface (`id`, `executeCommand`, `readFile`, `listFiles`, `destroy`)
- Provide a Docker-based implementation using dockerode (MVP)
- Support sandbox lifecycle: create, reconnect by ID, destroy
- `createDockerSandbox(options)` — create container, install git, clone repo
- `connectDockerSandbox(id)` — reconnect to existing container (for cross-activity use)

## Dependencies

- `@torin/shared` — logger
- Third-party: dockerode

## Key constraint

This package defines the abstraction boundary for sandbox providers. To add a new provider (Daytona, E2B, etc.), implement the `Sandbox` interface — no changes needed elsewhere.
