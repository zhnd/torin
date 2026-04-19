import {
  type DefectAnalysis,
  type ReproductionOracle,
  type ResolutionResult,
  resolutionResultSchema,
} from '@torin/domain';
import type { Sandbox } from '@torin/sandbox';
import type { AgentObserver } from '../../driver/observer.js';
import { runAgent } from '../../driver/run-agent.js';
import { createSandboxMcpServer } from '../../tools/sandbox-server.js';
import {
  SANDBOX_WRITE_TOOLS,
  sandboxOnlyToolConfig,
} from '../../tools/tool-config.js';
import {
  buildImplementResolutionUserPrompt,
  IMPLEMENT_RESOLUTION_SYSTEM_PROMPT,
} from './prompts.js';

export async function implementResolution(
  sandbox: Sandbox,
  defectDescription: string,
  analysis: DefectAnalysis,
  oracle: ReproductionOracle | null,
  userFeedback?: string,
  observer?: AgentObserver
): Promise<ResolutionResult> {
  const { result } = await runAgent<ResolutionResult>({
    agentName: 'implementResolution',
    stage: 'implement',
    systemPrompt: IMPLEMENT_RESOLUTION_SYSTEM_PROMPT,
    userPrompt: buildImplementResolutionUserPrompt(
      defectDescription,
      analysis,
      oracle,
      userFeedback
    ),
    schema: resolutionResultSchema,
    queryOptions: {
      mcpServers: { sandbox: createSandboxMcpServer(sandbox) },
      ...sandboxOnlyToolConfig(SANDBOX_WRITE_TOOLS),
      maxTurns: 40,
    },
    observer,
  });
  return result;
}
