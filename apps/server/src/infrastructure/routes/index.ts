import type { FastifyInstance } from 'fastify';
import { registerGraphQLRoutes } from './graphql.routes.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({ status: 'ok' }));

  await registerGraphQLRoutes(app);
}
