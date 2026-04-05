import { analyzeRepository } from '@torin/agent';
import type { AnalysisResult } from '@torin/domain';
import { connectDockerSandbox } from '@torin/sandbox';
import { log } from '../logger.js';

export async function analyzeCodeActivity(
  sandboxId: string
): Promise<AnalysisResult> {
  log.info({ sandboxId }, 'Running code analysis');
  const sandbox = await connectDockerSandbox(sandboxId);
  const result = await analyzeRepository(sandbox);
  log.info({ sandboxId }, 'Code analysis completed');
  return result;
}
