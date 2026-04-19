import { type Options, query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentObservation } from '@torin/domain';
import type { ZodType } from 'zod/v4';
import { log } from '../logger.js';
import { type AgentObserver, createObserver } from './observer.js';
import { parseAgentJson } from './parse-json.js';

export interface RunAgentInput<T> {
  /** Name used in logs and observer events. */
  agentName: string;
  /** Task-stage tag the observer attaches to every event. */
  stage: string;
  /** System prompt — the agent's role/rules. */
  systemPrompt: string;
  /** User prompt — the concrete instance to solve. */
  userPrompt: string;
  /** Query options (mcpServers, tool config, maxTurns). systemPrompt is set by us. */
  queryOptions: Omit<Options, 'systemPrompt'>;
  /**
   * Zod schema validating the agent's JSON output. Required unless a
   * custom `parse` is supplied. Using a schema (vs. `as T`) catches
   * malformed output at the stage boundary with a clear error instead
   * of a downstream crash.
   */
  schema?: ZodType<T>;
  /**
   * Custom parser for the raw text reply. Supply this only when the
   * agent is expected to return non-JSON (rare). If omitted, `schema`
   * is required and `parseAgentJson` is used.
   */
  parse?: (rawText: string) => T;
  /** Caller-provided observer. If omitted, one is created internally. */
  observer?: AgentObserver;
}

export interface RunAgentResult<T> {
  result: T;
  observation: AgentObservation;
}

/**
 * Shared driver for every agent in this package. Collapses the
 * repetitive query-loop + JSON-extraction + observer wiring into one
 * call. Each concrete agent passes a zod schema so its output is
 * runtime-validated at the stage boundary.
 */
export async function runAgent<T>(
  input: RunAgentInput<T>
): Promise<RunAgentResult<T>> {
  if (!input.schema && !input.parse) {
    throw new Error(
      `runAgent({ agentName: '${input.agentName}' }): pass either 'schema' or 'parse'`
    );
  }

  const model =
    input.queryOptions.model ?? process.env.AGENT_MODEL ?? 'claude-sonnet-4-6';

  const observer =
    input.observer ?? createObserver(input.stage, input.agentName);
  const parse =
    input.parse ??
    ((raw: string) => parseAgentJson(raw, input.schema as ZodType<T>));

  log.info({ agent: input.agentName, model }, `${input.agentName} starting`);

  let lastResult: string | undefined;

  for await (const message of query({
    prompt: input.userPrompt,
    options: {
      ...input.queryOptions,
      systemPrompt: input.systemPrompt,
      model,
    },
  })) {
    observer.onMessage(message);
    if (
      (message as Record<string, unknown>).type === 'result' &&
      (message as Record<string, unknown>).subtype === 'success'
    ) {
      lastResult = (message as { result: string }).result;
    }
  }

  if (!lastResult) {
    throw new Error(`${input.agentName} did not return a result`);
  }

  const parsed = parse(lastResult);
  log.info({ agent: input.agentName }, `${input.agentName} complete`);
  return { result: parsed, observation: observer.collect() };
}
