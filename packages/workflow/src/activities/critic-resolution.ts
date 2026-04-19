import { createObserver, criticResolution } from '@torin/agent';
import type {
  AgentObservation,
  CriticReview,
  DefectAnalysis,
  ReproductionOracle,
  ResolutionResult,
} from '@torin/domain';
import { connectSandbox, type SandboxState } from '@torin/sandbox';
import { log } from '../logger.js';

export async function criticResolutionActivity(
  state: SandboxState,
  defectDescription: string,
  analysis: DefectAnalysis,
  oracle: ReproductionOracle | null,
  resolution: ResolutionResult
): Promise<{ result: CriticReview; observation: AgentObservation }> {
  log.info(
    {
      filesChanged: resolution.filesChanged.length,
      scopeSize: analysis.scopeDeclaration.length,
    },
    'Starting critic review activity'
  );
  const sandbox = await connectSandbox(state);
  const observer = createObserver('critic', 'criticResolution');
  const result = await criticResolution(
    sandbox,
    defectDescription,
    analysis,
    oracle,
    resolution,
    observer
  );
  const observation = observer.collect();
  log.info(
    {
      approve: result.approve,
      score: result.score,
      concernCount: result.concerns.length,
      scopeAssessment: result.scopeAssessment,
    },
    'Critic review complete'
  );
  return { result, observation };
}
