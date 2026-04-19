import type { AgentCost, AgentObservation, ObservedEvent } from '@torin/domain';

export interface AgentObserver {
  onMessage(message: unknown): void;
  collect(): AgentObservation;
}

/**
 * Build an observer that turns Agent-SDK message stream events into the
 * flat `ObservedEvent[]` + `AgentCost` shape torin's observability layer
 * expects. Each tool-call becomes an event; the terminal `result` message
 * produces the cost breakdown.
 */
export function createObserver(
  stage: string,
  agentName: string
): AgentObserver {
  const events: ObservedEvent[] = [];
  let cost: AgentCost | null = null;

  return {
    onMessage(message: unknown) {
      const msg = message as Record<string, unknown>;

      if (msg.type === 'assistant') {
        const betaMessage = msg.message as {
          content?: Array<{ type: string; name?: string; input?: unknown }>;
        };
        if (betaMessage.content) {
          for (const block of betaMessage.content) {
            if (block.type === 'tool_use' && block.name) {
              events.push({
                stage,
                event: `Tool call: ${block.name}`,
                level: 'info',
                agent: agentName,
                tool: block.name,
                details: summarizeToolInput(block.name, block.input),
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      }

      if (msg.type === 'result') {
        if (msg.subtype === 'success') {
          const result = msg as {
            total_cost_usd: number;
            duration_ms: number;
            usage: { input_tokens: number; output_tokens: number };
            modelUsage: Record<
              string,
              { inputTokens: number; outputTokens: number; costUSD: number }
            >;
          };

          const modelName = Object.keys(result.modelUsage)[0] ?? 'unknown';
          cost = {
            totalCostUsd: result.total_cost_usd,
            inputTokens: result.usage.input_tokens,
            outputTokens: result.usage.output_tokens,
            durationMs: result.duration_ms,
            model: modelName,
          };

          events.push({
            stage,
            event: `Agent completed (${(result.duration_ms / 1000).toFixed(1)}s, $${result.total_cost_usd.toFixed(4)})`,
            level: 'info',
            agent: agentName,
            timestamp: new Date().toISOString(),
          });
        } else if (msg.subtype === 'error') {
          events.push({
            stage,
            event: 'Agent error',
            level: 'error',
            agent: agentName,
            details: String(msg.error ?? '').slice(0, 500),
            timestamp: new Date().toISOString(),
          });
        }
      }
    },

    collect(): AgentObservation {
      return { events, cost };
    },
  };
}

function summarizeToolInput(
  toolName: string,
  input: unknown
): string | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const inp = input as Record<string, unknown>;
  if (toolName.includes('bash') && typeof inp.command === 'string') {
    return inp.command.slice(0, 200);
  }
  if (typeof inp.path === 'string') {
    return inp.path;
  }
  return undefined;
}
