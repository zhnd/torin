import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../../activities/index.js';
import { SANDBOX_TASK_QUEUE } from '../../task-queues.js';

// main         — DB / GitHub API.
// sandboxInfra — sandbox create / destroy. Same cold-build path as
//                resolve-defect: base pull + clone + tier-2 setup
//                commands (capped at 20min). 30 min cap gives headroom.
// sandboxAgent — single analyze-code agent run; 15 min cap + 60s
//                heartbeatTimeout. The agent wrapper emits heartbeats
//                every 30s so a stuck container is detected within 60s
//                instead of waiting out the full startToCloseTimeout.

export const main = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 2 },
});

export const sandboxInfra = proxyActivities<typeof activities>({
  taskQueue: SANDBOX_TASK_QUEUE,
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 2 },
});

export const sandboxAgent = proxyActivities<typeof activities>({
  taskQueue: SANDBOX_TASK_QUEUE,
  startToCloseTimeout: '15 minutes',
  heartbeatTimeout: '60 seconds',
  retry: { maximumAttempts: 2 },
});
