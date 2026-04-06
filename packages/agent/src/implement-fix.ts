import { query } from '@anthropic-ai/claude-agent-sdk';
import type { BugAnalysis, FixResult } from '@torin/domain';
import type { Sandbox } from '@torin/sandbox';
import { log } from './logger.js';
import type { AgentObserver } from './observer.js';
import {
  buildImplementFixUserPrompt,
  IMPLEMENT_FIX_SYSTEM_PROMPT,
} from './prompts/implement-fix.js';
import { createSandboxMcpServer } from './tools/sandbox-tools.js';

export async function implementFix(
  sandbox: Sandbox,
  bugDescription: string,
  analysis: BugAnalysis,
  userFeedback?: string,
  observer?: AgentObserver
): Promise<FixResult> {
  const sandboxServer = createSandboxMcpServer(sandbox);

  let lastResult: string | undefined;

  const model = process.env.AGENT_MODEL ?? 'claude-sonnet-4-6';
  log.info(
    { model, hasUserFeedback: !!userFeedback },
    'Starting fix implementation'
  );

  for await (const message of query({
    prompt: buildImplementFixUserPrompt(bugDescription, analysis, userFeedback),
    options: {
      systemPrompt: IMPLEMENT_FIX_SYSTEM_PROMPT,
      model,
      mcpServers: { sandbox: sandboxServer },
      allowedTools: [
        'mcp__sandbox__bash',
        'mcp__sandbox__read_file',
        'mcp__sandbox__list_files',
        'mcp__sandbox__write_file',
      ],
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      maxTurns: 40,
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

  log.info({ hasResult: !!lastResult }, 'Fix implementation query finished');

  if (!lastResult) {
    throw new Error('Agent did not return a result');
  }

  const jsonMatch = lastResult.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `Agent did not return valid JSON. Raw result: ${lastResult.slice(0, 1000)}`
    );
  }

  const parsed = JSON.parse(jsonMatch[0]) as FixResult;
  log.info(
    {
      branch: parsed.branch,
      filesChanged: parsed.filesChanged,
      testsPassed: parsed.testsPassed,
    },
    'Fix implementation complete'
  );
  return parsed;
}
