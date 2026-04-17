import { analyzeDefect, createObserver } from '@torin/agent';
import type { AgentObservation, DefectAnalysis } from '@torin/domain';
import { connectSandbox, type SandboxState } from '@torin/sandbox';
import { log } from '../logger.js';

export async function analyzeDefectActivity(
  state: SandboxState,
  defectDescription: string,
  feedback?: string
): Promise<{ result: DefectAnalysis; observation: AgentObservation }> {
  log.info({ hasFeedback: !!feedback }, 'Starting defect analysis activity');
  const sandbox = await connectSandbox(state);
  const observer = createObserver('analysis', 'analyzeDefect');
  const result = await analyzeDefect(
    sandbox,
    defectDescription,
    feedback,
    observer
  );
  const observation = observer.collect();
  log.info(
    {
      rootCause: result.rootCause.slice(0, 100),
      eventCount: observation.events.length,
    },
    'Defect analysis complete'
  );
  return { result, observation };
}
