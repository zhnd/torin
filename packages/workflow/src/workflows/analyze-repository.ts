import { proxyActivities } from '@temporalio/workflow';
import type { AnalyzeRepositoryInput } from '@torin/domain';
import type { SandboxState } from '@torin/sandbox';
import type * as activities from '../activities/index.js';
import { SANDBOX_TASK_QUEUE } from '../task-queues.js';

const main = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 2 },
});

const sandboxInfra = proxyActivities<typeof activities>({
  taskQueue: SANDBOX_TASK_QUEUE,
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 2 },
});

const sandboxAgent = proxyActivities<typeof activities>({
  taskQueue: SANDBOX_TASK_QUEUE,
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 2 },
});

export async function analyzeRepositoryWorkflow(
  input: AnalyzeRepositoryInput
): Promise<void> {
  await main.updateTaskStatusActivity(input.taskId, 'RUNNING');

  await main.saveTaskEventsActivity(
    input.taskId,
    [
      {
        stage: 'analysis',
        event: 'Analysis stage started',
        level: 'info',
        timestamp: new Date().toISOString(),
      },
    ],
    null,
    { stage: 'analysis', status: 'running' }
  );

  let sandboxState: SandboxState | undefined;
  try {
    sandboxState = await sandboxInfra.createSandboxActivity(
      input.repositoryUrl
    );

    const { result, observation } =
      await sandboxAgent.analyzeCodeActivity(sandboxState);

    await main.saveTaskEventsActivity(
      input.taskId,
      observation.events,
      observation.cost,
      { stage: 'analysis', status: 'completed' }
    );

    await main.updateTaskStatusActivity(input.taskId, 'COMPLETED', result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await main.updateTaskStatusActivity(
      input.taskId,
      'FAILED',
      undefined,
      message
    );
  } finally {
    if (sandboxState) {
      await sandboxInfra.destroySandboxActivity(sandboxState);
    }
  }
}
