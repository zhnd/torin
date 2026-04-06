import type { FastifyInstance } from 'fastify';
import { auth } from '../auth/better-auth.config.js';

export const registerAuthRoutes = async (
  app: FastifyInstance
): Promise<void> => {
  app.all('/api/auth/*', async (request, reply) => {
    try {
      const protocol = request.protocol;
      const host = request.headers.host || 'localhost:4000';
      const url = new URL(request.url, `${protocol}://${host}`);

      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value) headers.append(key, value.toString());
      }

      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      const response = await auth.handler(req);

      reply.status(response.status);

      for (const [key, value] of response.headers) {
        reply.header(key, value);
      }

      const responseBody = await response.text();
      reply.send(responseBody || null);
    } catch (error) {
      app.log.error(error, '[Auth Routes] Error:');
      reply.status(500).send({
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
      });
    }
  });
};
