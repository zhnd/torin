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
- `@torin/githost` — `parseRepoUrl` for project URL/provider validation in services
- `@torin/shared` — logger, utilities

## Internal structure

```
src/
  infrastructure/
    graphql/      # Pothos builder, schema, context
    routes/       # Fastify route registration (GraphQL, health)
    auth/         # better-auth config
    errors/       # Error types (AppError, NotFoundError, UnauthorizedError)
  modules/{domain}/
    {domain}.schema.ts       # GraphQL types only (builder.prismaObject)
    {domain}.resolvers.ts    # Queries + Mutations (instantiate service, call execute)
    services/
      {operation}.service.ts # Business logic (validation, auth, Prisma ops)
    dto/
      {operation}.input.ts   # GraphQL input types (builder.inputType)
    index.ts                 # Entry: imports schema + resolvers for side-effect registration
  logger.ts       # Package-level Pino logger
  server.ts       # Fastify bootstrap
```

## Module conventions

- **Schema and resolvers are separate files** — never mix type definitions with query/mutation logic
- **One service per operation** — no god services; class with `execute()` method
- **Resolvers are thin** — instantiate service, call `service.execute(query, input, user)`, return result
- **Services own business logic** — validation, authorization, Prisma operations
- **Use error classes** from `infrastructure/errors/` (NotFoundError, UnauthorizedError, ValidationError)
- **Always spread `query`** in Prisma calls for Pothos N+1 optimization
- **Register modules** in `infrastructure/graphql/schema.ts` via side-effect import

## Key constraint

This package does NOT execute tasks directly. All execution goes through Temporal workflows. The server is a thin API layer.
