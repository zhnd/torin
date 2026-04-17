import { analyzeRepository, createObserver } from '@torin/agent';
import type { AgentObservation, AnalysisResult } from '@torin/domain';
import { connectSandbox, type SandboxState } from '@torin/sandbox';
import { log } from '../logger.js';

export async function analyzeCodeActivity(
  state: SandboxState
): Promise<{ result: AnalysisResult; observation: AgentObservation }> {
  log.info('Running code analysis');
  const sandbox = await connectSandbox(state);
  const observer = createObserver('analysis', 'analyzeRepository');
  const result = await analyzeRepository(sandbox, observer);
  const observation = observer.collect();
  log.info(
    { eventCount: observation.events.length },
    'Code analysis completed'
  );
  return { result, observation };
}
