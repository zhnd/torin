import { fileURLToPath } from 'node:url';
import { NativeConnection, Worker } from '@temporalio/worker';
import { TASK_QUEUE } from '@torin/workflow';
import * as activities from '@torin/workflow/activities';
import { log } from './logger.js';

log.info(
  {
    databaseUrl: process.env.DATABASE_URL ? 'set' : 'NOT SET',
    temporalAddress: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233 (default)',
    activities: Object.keys(activities),
  },
  'Worker starting'
);

async function main() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });

  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: TASK_QUEUE,
    workflowsPath: fileURLToPath(
      import.meta.resolve('@torin/workflow/workflows')
    ),
    activities,
  });

  log.info({ taskQueue: TASK_QUEUE }, 'Worker started, listening');
  await worker.run();
}

main().catch((err) => {
  log.fatal({ err }, 'Worker failed to start');
  process.exit(1);
});
