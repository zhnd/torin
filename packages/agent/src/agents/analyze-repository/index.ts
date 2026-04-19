import { type AnalysisResult, analysisResultSchema } from '@torin/domain';
import type { Sandbox } from '@torin/sandbox';
import type { AgentObserver } from '../../driver/observer.js';
import { runAgent } from '../../driver/run-agent.js';
import { createSandboxMcpServer } from '../../tools/sandbox-server.js';
import {
  SANDBOX_READ_TOOLS,
  sandboxOnlyToolConfig,
} from '../../tools/tool-config.js';
import { ANALYZE_SYSTEM_PROMPT, ANALYZE_USER_PROMPT } from './prompts.js';

export async function analyzeRepository(
  sandbox: Sandbox,
  observer?: AgentObserver
): Promise<AnalysisResult> {
  const { result } = await runAgent<AnalysisResult>({
    agentName: 'analyzeRepository',
    stage: 'analysis',
    systemPrompt: ANALYZE_SYSTEM_PROMPT,
    userPrompt: ANALYZE_USER_PROMPT,
    schema: analysisResultSchema,
    queryOptions: {
      mcpServers: { sandbox: createSandboxMcpServer(sandbox) },
      ...sandboxOnlyToolConfig(SANDBOX_READ_TOOLS),
      maxTurns: 20,
    },
    observer,
  });
  return result;
}
