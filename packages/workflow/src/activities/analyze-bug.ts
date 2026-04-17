import { analyzeBug, createObserver } from '@torin/agent';
import type { AgentObservation, BugAnalysis } from '@torin/domain';
import { connectSandbox, type SandboxState } from '@torin/sandbox';
import { log } from '../logger.js';

export async function analyzeBugActivity(
  state: SandboxState,
  bugDescription: string,
  feedback?: string
): Promise<{ result: BugAnalysis; observation: AgentObservation }> {
  log.info({ hasFeedback: !!feedback }, 'Starting bug analysis activity');
  const sandbox = await connectSandbox(state);
  const observer = createObserver('analysis', 'analyzeBug');
  const result = await analyzeBug(sandbox, bugDescription, feedback, observer);
  const observation = observer.collect();
  log.info(
    {
      rootCause: result.rootCause.slice(0, 100),
      eventCount: observation.events.length,
    },
    'Bug analysis complete'
  );
  return { result, observation };
}
