import { proxyActivities } from '@temporalio/workflow';
import type { AnalyzeRepositoryInput } from '@torin/domain';
import type * as activities from '../activities/index.js';

const { updateTaskStatusActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

const { createSandboxActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

const { analyzeCodeActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 2 },
});

const { destroySandboxActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function analyzeRepositoryWorkflow(
  input: AnalyzeRepositoryInput
): Promise<void> {
  await updateTaskStatusActivity(input.taskId, 'RUNNING');

  let sandboxId: string | undefined;
  try {
    sandboxId = await createSandboxActivity(input.repositoryUrl);
    const result = await analyzeCodeActivity(sandboxId);
    await updateTaskStatusActivity(input.taskId, 'COMPLETED', result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateTaskStatusActivity(input.taskId, 'FAILED', undefined, message);
  } finally {
    if (sandboxId) {
      await destroySandboxActivity(sandboxId);
    }
  }
}
