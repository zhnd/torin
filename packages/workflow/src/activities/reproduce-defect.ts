import { createObserver, reproduceDefect } from '@torin/agent';
import type {
  AgentObservation,
  DefectAnalysis,
  ReproductionOracle,
} from '@torin/domain';
import { connectSandbox, type SandboxState } from '@torin/sandbox';
import { log } from '../logger.js';

export async function reproduceDefectActivity(
  state: SandboxState,
  analysis: DefectAnalysis
): Promise<{ result: ReproductionOracle; observation: AgentObservation }> {
  log.info(
    {
      hasTestInfra: analysis.hasTestInfra,
      hasWebUI: analysis.hasWebUI,
      riskClass: analysis.riskClass,
    },
    'Starting reproduction activity'
  );
  const sandbox = await connectSandbox(state);
  const observer = createObserver('reproduce', 'reproduceDefect');
  const result = await reproduceDefect(sandbox, analysis, observer);
  const observation = observer.collect();
  log.info(
    {
      mode: result.mode,
      confirmedFailing: result.confirmedFailing,
      eventCount: observation.events.length,
    },
    'Reproduction activity complete'
  );
  return { result, observation };
}
