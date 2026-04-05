# @torin/server

GraphQL API entry point for the Torin system.

## Responsibilities

- Expose GraphQL API via Apollo Server + Fastify (queries, mutations)
- Validate and transform incoming requests
- Delegate task execution to Temporal via `@torin/workflow` client
- Serve task status and results to `@torin/web`

## Tech stack

- Fastify 5 (HTTP framework)
- Apollo Server 5 (GraphQL)
- Pothos (code-first GraphQL schema builder with Prisma plugin)
- better-auth (authentication)

## Dependencies

- `@torin/database` — Prisma client, Pothos types
- `@torin/workflow` — start and query workflows
- `@torin/shared` — logger, utilities

## Internal structure

```
src/
  infrastructure/
    graphql/      # Pothos builder, schema, context
    routes/       # Fastify route registration (GraphQL, health)
    auth/         # better-auth config
    errors/       # Error types
  modules/
    task/         # Task GraphQL type, query, mutation
  logger.ts       # Package-level Pino logger
  server.ts       # Fastify bootstrap
```

## Key constraint

This package does NOT execute tasks directly. All execution goes through Temporal workflows. The server is a thin API layer.
