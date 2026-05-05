import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../../activities/index.js';
import { SANDBOX_TASK_QUEUE } from '../../task-queues.js';

// main         — DB / GitHub API; high concurrency, short timeout.
// sandboxInfra — sandbox create / destroy / push / filter. Cold-build
//                path includes base-image pull + repo clone + tier-2
//                setup commands (`pnpm install` etc., capped at 20min
//                via TORIN_SETUP_COMMAND_TIMEOUT_MS), so 30 min total
//                gives ~10min headroom for the surrounding work.
// sandboxAgent — agent-driven stages (analyze / reproduce / implement / critic).
//                Long-form: 45 min cap + 60s heartbeatTimeout. The agent
//                wrapper emits heartbeats every 30s so a hung tool call
//                can be detected within 60s instead of waiting out the
//                full startToCloseTimeout.
//
// Proxies are module-scope so phase modules import them directly; no
// parameter plumbing through the orchestrator.

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
  startToCloseTimeout: '45 minutes',
  heartbeatTimeout: '60 seconds',
  retry: { maximumAttempts: 2 },
});
