import { createObserver, implementFix } from '@torin/agent';
import type { AgentObservation, BugAnalysis, FixResult } from '@torin/domain';
import { connectDockerSandbox } from '@torin/sandbox';
import { log } from '../logger.js';

export async function implementFixActivity(
  sandboxId: string,
  bugDescription: string,
  analysis: BugAnalysis,
  userFeedback?: string
): Promise<{ result: FixResult; observation: AgentObservation }> {
  log.info({ sandboxId }, 'Starting fix implementation activity');
  const sandbox = await connectDockerSandbox(sandboxId);
  const observer = createObserver('implement', 'implementFix');
  const result = await implementFix(
    sandbox,
    bugDescription,
    analysis,
    userFeedback,
    observer
  );
  const observation = observer.collect();
  log.info(
    {
      branch: result.branch,
      testsPassed: result.testsPassed,
      eventCount: observation.events.length,
    },
    'Fix implementation complete'
  );
  return { result, observation };
}
