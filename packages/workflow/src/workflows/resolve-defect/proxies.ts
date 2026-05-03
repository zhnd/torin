import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../../activities/index.js';
import { SANDBOX_TASK_QUEUE } from '../../task-queues.js';

// main         — DB / GitHub API; high concurrency, short timeout.
// sandboxInfra — sandbox create / destroy / push / filter; 10 min cap.
// sandboxAgent — agent-driven stages (analyze / reproduce / implement / critic); 20 min cap.
//
// Proxies are module-scope so phase modules import them directly; no
// parameter plumbing through the orchestrator.

export const main = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 2 },
});

export const sandboxInfra = proxyActivities<typeof activities>({
  taskQueue: SANDBOX_TASK_QUEUE,
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 2 },
});

export const sandboxAgent = proxyActivities<typeof activities>({
  taskQueue: SANDBOX_TASK_QUEUE,
  startToCloseTimeout: '20 minutes',
  retry: { maximumAttempts: 2 },
});
