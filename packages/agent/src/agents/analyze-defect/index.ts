import { type DefectAnalysis, defectAnalysisSchema } from '@torin/domain';
import type { Sandbox } from '@torin/sandbox';
import type { AgentObserver } from '../../driver/observer.js';
import { runAgent } from '../../driver/run-agent.js';
import { createSandboxMcpServer } from '../../tools/sandbox-server.js';
import {
  SANDBOX_READ_TOOLS,
  sandboxOnlyToolConfig,
} from '../../tools/tool-config.js';
import {
  ANALYZE_DEFECT_SYSTEM_PROMPT,
  buildAnalyzeDefectUserPrompt,
} from './prompts.js';

export async function analyzeDefect(
  sandbox: Sandbox,
  defectDescription: string,
  feedback?: string,
  observer?: AgentObserver
): Promise<DefectAnalysis> {
  const { result } = await runAgent<DefectAnalysis>({
    agentName: 'analyzeDefect',
    stage: 'analysis',
    systemPrompt: ANALYZE_DEFECT_SYSTEM_PROMPT,
    userPrompt: buildAnalyzeDefectUserPrompt(defectDescription, feedback),
    schema: defectAnalysisSchema,
    queryOptions: {
      mcpServers: { sandbox: createSandboxMcpServer(sandbox) },
      ...sandboxOnlyToolConfig(SANDBOX_READ_TOOLS),
      maxTurns: 20,
    },
    observer,
  });
  return result;
}
