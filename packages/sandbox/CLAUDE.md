# @torin/sandbox

Isolated code execution environment for the Torin system.

## Responsibilities

- Define a unified `Sandbox` interface for code execution in isolated environments
- Provide a Docker-based implementation using dockerode (MVP)
- Manage sandbox lifecycle: create, execute, destroy

## Dependencies

None (`@torin/*` packages). Only third-party: dockerode.

## Key constraint

This package defines the abstraction boundary for sandbox providers. To add a new provider (Daytona, E2B, etc.), implement the `Sandbox` interface — no changes needed elsewhere.
