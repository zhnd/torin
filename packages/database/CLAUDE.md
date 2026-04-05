# @torin/database

Shared database layer for the Torin system.

## Responsibilities

- Own the Prisma schema, migrations, and configuration
- Provide a shared PrismaClient instance for all packages
- Export generated Pothos types for GraphQL integration
- Database connection management

## Dependencies

None (`@torin/*` packages). Only third-party: Prisma, pg.

## Key constraint

This is the single source of truth for database schema and access. No other package should define its own Prisma setup.
