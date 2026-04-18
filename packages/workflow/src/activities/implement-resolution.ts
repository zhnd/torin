import { createObserver, implementResolution } from '@torin/agent';
import type {
  AgentObservation,
  DefectAnalysis,
  ReproductionOracle,
  ResolutionResult,
} from '@torin/domain';
import { connectSandbox, type SandboxState } from '@torin/sandbox';
import { log } from '../logger.js';

export async function implementResolutionActivity(
  state: SandboxState,
  defectDescription: string,
  analysis: DefectAnalysis,
  oracle: ReproductionOracle | null,
  userFeedback?: string
): Promise<{ result: ResolutionResult; observation: AgentObservation }> {
  log.info(
    {
      oracleMode: oracle?.mode,
      scopeSize: analysis.scopeDeclaration.length,
      hasFeedback: !!userFeedback,
    },
    'Starting resolution implementation activity'
  );
  const sandbox = await connectSandbox(state);
  const observer = createObserver('implement', 'implementResolution');
  const result = await implementResolution(
    sandbox,
    defectDescription,
    analysis,
    oracle,
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
    'Resolution implementation complete'
  );
  return { result, observation };
}
