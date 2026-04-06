import { analyzeRepository, createObserver } from '@torin/agent';
import type { AgentObservation, AnalysisResult } from '@torin/domain';
import { connectDockerSandbox } from '@torin/sandbox';
import { log } from '../logger.js';

export async function analyzeCodeActivity(
  sandboxId: string
): Promise<{ result: AnalysisResult; observation: AgentObservation }> {
  log.info({ sandboxId }, 'Running code analysis');
  const sandbox = await connectDockerSandbox(sandboxId);
  const observer = createObserver('analysis', 'analyzeRepository');
  const result = await analyzeRepository(sandbox, observer);
  const observation = observer.collect();
  log.info(
    { sandboxId, eventCount: observation.events.length },
    'Code analysis completed'
  );
  return { result, observation };
}
