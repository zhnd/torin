import type { FastifyInstance } from 'fastify';
import { registerAuthRoutes } from './auth.routes.js';
import { registerGraphQLRoutes } from './graphql.routes.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({ status: 'ok' }));

  await registerAuthRoutes(app);
  await registerGraphQLRoutes(app);
}
