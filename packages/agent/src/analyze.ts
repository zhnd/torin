import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AnalysisResult } from '@torin/domain';
import type { Sandbox } from '@torin/sandbox';
import { log } from './logger.js';
import {
  ANALYZE_SYSTEM_PROMPT,
  ANALYZE_USER_PROMPT,
} from './prompts/analyze-repository.js';
import { createSandboxMcpServer } from './tools/sandbox-tools.js';

export async function analyzeRepository(
  sandbox: Sandbox
): Promise<AnalysisResult> {
  const sandboxServer = createSandboxMcpServer(sandbox);

  let lastResult: string | undefined;

  const model = process.env.AGENT_MODEL ?? 'claude-sonnet-4-6';
  log.info(
    { model, baseUrl: process.env.ANTHROPIC_BASE_URL ?? '(not set)' },
    'Starting agent query'
  );

  for await (const message of query({
    prompt: ANALYZE_USER_PROMPT,
    options: {
      systemPrompt: ANALYZE_SYSTEM_PROMPT,
      model,
      mcpServers: {
        sandbox: sandboxServer,
      },
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
    log.debug(
      {
        type: message.type,
        subtype: (message as Record<string, unknown>).subtype,
      },
      'Agent message'
    );

    if (message.type === 'result') {
      if (message.subtype === 'success') {
        lastResult = message.result;
        log.debug(
          { preview: lastResult?.slice(0, 200) },
          'Success result received'
        );
      } else {
        log.error(
          { result: JSON.stringify(message).slice(0, 1000) },
          'Non-success result'
        );
      }
    }
  }

  log.info({ hasResult: !!lastResult }, 'Query loop finished');

  if (!lastResult) {
    throw new Error('Agent did not return a result');
  }

  const jsonMatch = lastResult.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `Agent did not return valid JSON analysis. Raw result: ${lastResult.slice(0, 1000)}`
    );
  }

  log.info('Parsed JSON successfully');
  return JSON.parse(jsonMatch[0]) as AnalysisResult;
}
