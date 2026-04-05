import { ApolloServer } from '@apollo/server';
import fastifyApollo, {
  fastifyApolloDrainPlugin,
} from '@as-integrations/fastify';
import { initContextCache } from '@pothos/core';
import type { FastifyInstance } from 'fastify';
import type { Context } from '../graphql/context.js';
import { createContext } from '../graphql/context.js';
import { schema } from '../graphql/schema.js';

export async function registerGraphQLRoutes(
  app: FastifyInstance
): Promise<void> {
  const apollo = new ApolloServer<Context>({
    schema,
    plugins: [fastifyApolloDrainPlugin(app)],
    introspection: process.env.NODE_ENV !== 'production',
  });

  await apollo.start();

  await app.register(fastifyApollo(apollo), {
    context: async (request, reply) => ({
      ...initContextCache(),
      ...createContext(request, reply),
    }),
  });
}
