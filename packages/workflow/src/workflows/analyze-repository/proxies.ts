import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../../activities/index.js';
import { SANDBOX_TASK_QUEUE } from '../../task-queues.js';

// main         — DB / GitHub API.
// sandboxInfra — sandbox create / destroy; 5 min cap (analyze is shorter
//                than resolve-defect's full pipeline).
// sandboxAgent — single analyze-code agent run; 10 min cap.

export const main = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 2 },
});

export const sandboxInfra = proxyActivities<typeof activities>({
  taskQueue: SANDBOX_TASK_QUEUE,
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 2 },
});

export const sandboxAgent = proxyActivities<typeof activities>({
  taskQueue: SANDBOX_TASK_QUEUE,
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 2 },
});
