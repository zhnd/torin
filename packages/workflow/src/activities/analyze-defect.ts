import { analyzeDefect } from '@torin/agent';
import type { DefectAnalysis } from '@torin/domain';
import { connectSandbox, type SandboxState } from '@torin/sandbox';
import { log } from '../logger.js';
import {
  type AgentActivityResult,
  runAgentInActivity,
} from '../utils/agent-activity.js';

export async function analyzeDefectActivity(
  state: SandboxState,
  defectDescription: string,
  feedback?: string
): Promise<AgentActivityResult<DefectAnalysis>> {
  log.info({ hasFeedback: !!feedback }, 'Starting defect analysis activity');
  const sandbox = await connectSandbox(state);
  const out = await runAgentInActivity(
    'analysis',
    'analyzeDefect',
    (observer) => analyzeDefect(sandbox, defectDescription, feedback, observer)
  );
  if (out.result) {
    log.info(
      {
        rootCause: out.result.rootCause.slice(0, 100),
        eventCount: out.observation.events.length,
      },
      'Defect analysis complete'
    );
  }
  return out;
}
