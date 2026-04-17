import { Client, Connection } from '@temporalio/client';

/**
 * Main task queue — carries workflow execution and lightweight activities
 * (DB updates, GitHub API calls). Concurrency is cheap here.
 */
export const TASK_QUEUE = 'torin-main';

/**
 * Sandbox task queue — carries every activity that touches a Docker
 * container (create/destroy, agent runs, git push). Worker concurrency on
 * this queue is gated by SANDBOX_CONCURRENCY to protect host resources and
 * stay under model-API rate limits. Workflows themselves do NOT run here.
 */
export const SANDBOX_TASK_QUEUE = 'torin-sandbox-heavy';

export async function createTemporalClient(): Promise<Client> {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });
  return new Client({ connection });
}
