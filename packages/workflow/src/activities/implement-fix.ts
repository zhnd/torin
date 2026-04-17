import { createObserver, implementFix } from '@torin/agent';
import type { AgentObservation, BugAnalysis, FixResult } from '@torin/domain';
import { connectSandbox, type SandboxState } from '@torin/sandbox';
import { log } from '../logger.js';

export async function implementFixActivity(
  state: SandboxState,
  bugDescription: string,
  analysis: BugAnalysis,
  userFeedback?: string
): Promise<{ result: FixResult; observation: AgentObservation }> {
  log.info('Starting fix implementation activity');
  const sandbox = await connectSandbox(state);
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
