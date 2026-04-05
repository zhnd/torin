import cors from '@fastify/cors';
import { loggerConfig } from '@torin/shared';
import Fastify from 'fastify';
import { registerRoutes } from './infrastructure/routes/index.js';
import { log } from './logger.js';

async function main(): Promise<void> {
  const app = Fastify({
    logger: loggerConfig,
  });

  await app.register(cors, {
    origin: process.env.WEB_URL ? process.env.WEB_URL.split(',') : true,
    credentials: true,
  });

  await registerRoutes(app);

  const port = Number(process.env.PORT) || 4000;

  app.listen({ port, host: '0.0.0.0' }, (err, address) => {
    if (err) throw err;
    app.log.info(`Server ready at: ${address}`);
  });
}

main().catch((err) => {
  log.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
