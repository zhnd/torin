import { query } from '@anthropic-ai/claude-agent-sdk';
import type { DefectAnalysis, ReproductionOracle } from '@torin/domain';
import type { Sandbox } from '@torin/sandbox';
import { log } from './logger.js';
import type { AgentObserver } from './observer.js';
import {
  buildReproduceUserPrompt,
  REPRODUCE_SCRIPT_SYSTEM_PROMPT,
  REPRODUCE_TEST_SYSTEM_PROMPT,
  REPRODUCE_WEB_SYSTEM_PROMPT,
} from './prompts/reproduce-defect.js';
import { createSandboxMcpServer } from './tools/sandbox-tools.js';

/**
 * Generate a reproduction oracle for the defect. Mode is chosen by the
 * analysis signals. On success, the agent has already verified the oracle
 * fails on HEAD.
 */
export async function reproduceDefect(
  sandbox: Sandbox,
  analysis: DefectAnalysis,
  observer?: AgentObserver
): Promise<ReproductionOracle> {
  const systemPrompt = pickSystemPrompt(analysis);
  if (!systemPrompt) {
    return {
      mode: 'none',
      runCommand: '',
      confirmedFailing: false,
      skipReason:
        'No test infra detected and project has no obvious way to reproduce programmatically.',
    };
  }

  const sandboxServer = createSandboxMcpServer(sandbox);
  const model = process.env.AGENT_MODEL ?? 'claude-sonnet-4-6';
  log.info(
    {
      model,
      mode: systemPrompt.label,
      hasTestInfra: analysis.hasTestInfra,
      hasWebUI: analysis.hasWebUI,
    },
    'Starting reproduction generation'
  );

  let lastResult: string | undefined;

  for await (const message of query({
    prompt: buildReproduceUserPrompt(analysis),
    options: {
      systemPrompt: systemPrompt.text,
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
      maxTurns: 20,
    },
  })) {
    observer?.onMessage(message);
    if (message.type === 'result' && message.subtype === 'success') {
      lastResult = message.result;
    }
  }

  if (!lastResult) {
    throw new Error('Reproduce agent did not return a result');
  }

  const jsonMatch = lastResult.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `Reproduce agent did not return JSON. Raw: ${lastResult.slice(0, 500)}`
    );
  }

  const parsed = JSON.parse(jsonMatch[0]) as ReproductionOracle;
  log.info(
    {
      mode: parsed.mode,
      confirmedFailing: parsed.confirmedFailing,
      filePath: parsed.filePath,
    },
    'Reproduction generation complete'
  );

  return parsed;
}

function pickSystemPrompt(
  analysis: DefectAnalysis
): { label: string; text: string } | null {
  if (analysis.hasWebUI && analysis.hasTestInfra) {
    return { label: 'web+test', text: REPRODUCE_WEB_SYSTEM_PROMPT };
  }
  if (analysis.hasTestInfra) {
    return { label: 'test-framework', text: REPRODUCE_TEST_SYSTEM_PROMPT };
  }
  if (analysis.hasWebUI) {
    // Web only, no tests — steps-based reproduction, FILTER will run boot-verify.
    return { label: 'web', text: REPRODUCE_WEB_SYSTEM_PROMPT };
  }
  // Non-web, no tests — verify script is the best we can do.
  return { label: 'verify-script', text: REPRODUCE_SCRIPT_SYSTEM_PROMPT };
}
