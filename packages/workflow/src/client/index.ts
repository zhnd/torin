import { Client, Connection } from '@temporalio/client';

export const TASK_QUEUE = 'torin-main';

export async function createTemporalClient(): Promise<Client> {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });
  return new Client({ connection });
}
