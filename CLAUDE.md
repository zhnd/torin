# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Torin is an AI-powered execution system for software engineering. It turns engineering tasks into executable systems — understanding tasks, breaking them into steps, executing with tools, tracking state across long-running workflows, recovering from failure, and remaining observable and controllable throughout.

## Architecture

pnpm monorepo. Each package has its own CLAUDE.md with detailed responsibilities.

```
apps/
  server/       # HTTP API entry point
  web/          # Frontend — task dashboard, logs, controls
  worker/       # Temporal worker process

packages/
  domain/       # Core types shared across the system
  workflow/     # Temporal workflows, activities, and client
  agent/        # LLM calls, planner, prompt builders
  shared/       # Logger, config, error utilities
```

### Dependency direction

```
server → workflow/client → domain
worker → workflow → agent → domain
All packages may use shared
web → server (HTTP only)
```

### Key principle

agent decides *what* to do; workflow activities *execute* it. Temporal is the runtime for orchestration — workflows define the control flow, activities perform side effects.

## Build & Dev

- Package manager: pnpm (v10.33+)
- `pnpm build` / `pnpm dev` / `pnpm typecheck` from root runs across all packages

## Design Principles

- Execution over generation
- Workflows over scripts
- Observability by default
- Controllable automation
- Modular tool-based architecture
- Human-in-the-loop when necessary
