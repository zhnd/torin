import { proxyActivities } from '@temporalio/workflow';
import type { AnalyzeRepositoryInput } from '@torin/domain';
import type * as activities from '../activities/index.js';

const shortActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 2 },
});

const longActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 2 },
});

const infraActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

export async function analyzeRepositoryWorkflow(
  input: AnalyzeRepositoryInput
): Promise<void> {
  await shortActivities.updateTaskStatusActivity(input.taskId, 'RUNNING');

  await shortActivities.saveTaskEventsActivity(
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

  let sandboxId: string | undefined;
  try {
    sandboxId = await infraActivities.createSandboxActivity(
      input.repositoryUrl
    );

    const { result, observation } =
      await longActivities.analyzeCodeActivity(sandboxId);

    await shortActivities.saveTaskEventsActivity(
      input.taskId,
      observation.events,
      observation.cost,
      { stage: 'analysis', status: 'completed' }
    );

    await shortActivities.updateTaskStatusActivity(
      input.taskId,
      'COMPLETED',
      result
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await shortActivities.updateTaskStatusActivity(
      input.taskId,
      'FAILED',
      undefined,
      message
    );
  } finally {
    if (sandboxId) {
      await infraActivities.destroySandboxActivity(sandboxId);
    }
  }
}
