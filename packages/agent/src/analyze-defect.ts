import { query } from '@anthropic-ai/claude-agent-sdk';
import type { DefectAnalysis } from '@torin/domain';
import type { Sandbox } from '@torin/sandbox';
import { log } from './logger.js';
import type { AgentObserver } from './observer.js';
import {
  ANALYZE_DEFECT_SYSTEM_PROMPT,
  buildAnalyzeDefectUserPrompt,
} from './prompts/analyze-defect.js';
import { createSandboxMcpServer } from './tools/sandbox-tools.js';

export async function analyzeDefect(
  sandbox: Sandbox,
  defectDescription: string,
  feedback?: string,
  observer?: AgentObserver
): Promise<DefectAnalysis> {
  const sandboxServer = createSandboxMcpServer(sandbox);

  let lastResult: string | undefined;

  const model = process.env.AGENT_MODEL ?? 'claude-sonnet-4-6';
  log.info({ model, hasFeedback: !!feedback }, 'Starting defect analysis');

  for await (const message of query({
    prompt: buildAnalyzeDefectUserPrompt(defectDescription, feedback),
    options: {
      systemPrompt: ANALYZE_DEFECT_SYSTEM_PROMPT,
      model,
      mcpServers: { sandbox: sandboxServer },
      allowedTools: [
        'mcp__sandbox__bash',
        'mcp__sandbox__read_file',
        'mcp__sandbox__list_files',
      ],
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      maxTurns: 20,
    },
  })) {
    observer?.onMessage(message);
    log.debug(
      {
        type: message.type,
        subtype: (message as Record<string, unknown>).subtype,
      },
      'Agent message'
    );

    if (message.type === 'result' && message.subtype === 'success') {
      lastResult = message.result;
    }
  }

  log.info({ hasResult: !!lastResult }, 'Defect analysis query finished');

  if (!lastResult) {
    throw new Error('Agent did not return a result');
  }

  const jsonMatch = lastResult.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `Agent did not return valid JSON. Raw result: ${lastResult.slice(0, 1000)}`
    );
  }

  const parsed = JSON.parse(jsonMatch[0]) as DefectAnalysis;
  log.info(
    { rootCause: parsed.rootCause.slice(0, 100), files: parsed.affectedFiles },
    'Defect analysis complete'
  );
  return parsed;
}
