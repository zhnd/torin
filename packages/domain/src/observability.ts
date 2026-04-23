/**
 * OTel-shaped execution telemetry types. These mirror Layer 1 Prisma
 * models in packages/database/prisma/schema.prisma but exist here so
 * producers (observer, activities) and consumers (server, web) share a
 * single contract without pulling in the Prisma client type.
 */

// ── Size caps for truncated fields ─────────────────────────

export const TOOL_OUTPUT_CAP_BYTES = 32 * 1024;
export const TURN_TEXT_CAP_BYTES = 8 * 1024;

// ── Status-ish vocabulary (as-const maps, not enums) ───────

export const EXECUTION_STATUS = {
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
export type ExecutionStatusValue =
  (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

export const STAGE_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  AWAITING: 'AWAITING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
} as const;
export type StageStatusValue =
  (typeof STAGE_STATUS)[keyof typeof STAGE_STATUS];

export const AGENT_INVOCATION_STATUS = {
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
} as const;
export type AgentInvocationStatusValue =
  (typeof AGENT_INVOCATION_STATUS)[keyof typeof AGENT_INVOCATION_STATUS];

export const ATTEMPT_TRIGGER_KIND = {
  INITIAL: 'initial',
  REFLEXION_RETRY: 'reflexion-retry',
  HITL_REJECT: 'hitl-reject',
  SAMPLE_GENERATION: 'sample-generation',
  FILTER_FAIL_RETRY: 'filter-fail-retry',
} as const;
export type AttemptTriggerKind =
  (typeof ATTEMPT_TRIGGER_KIND)[keyof typeof ATTEMPT_TRIGGER_KIND];

// ── Trace capture shapes (producer-facing) ─────────────────

export interface ToolCallTrace {
  toolUseId: string;
  name: string;
  input: unknown;
  output: string | null;
  outputTruncatedAt: number | null;
  success: boolean | null;
  errorText: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  agentTurnIndex: number | null;
  spanId: string;
  parentSpanId: string;
}

export interface AgentTurnTrace {
  turnIndex: number;
  role: 'assistant' | 'system';
  textContent: string | null;
  textTruncatedAt: number | null;
  toolUseCount: number;
  inputTokens: number | null;
  outputTokens: number | null;
  startedAt: string;
}

export interface AgentInvocationTrace {
  agentName: string;
  model: string;
  status: AgentInvocationStatusValue;
  errorText: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  totalCostUsd: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  turns: AgentTurnTrace[];
  toolCalls: ToolCallTrace[];
  spanId: string;
  parentSpanId: string;
}

// ── Record-shaped types (consumer-facing, mirrors DB rows) ─

export interface WorkflowExecutionRecord {
  id: string;
  taskId: string;
  workflowKind: string;
  workflowVersion: number;
  traceId: string;
  temporalWorkflowId: string | null;
  status: ExecutionStatusValue;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
}

export interface StageExecutionRecord {
  id: string;
  workflowExecutionId: string;
  stageName: string;
  order: number;
  status: StageStatusValue;
  spanId: string;
  parentSpanId: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
}

export interface AttemptExecutionRecord {
  id: string;
  stageExecutionId: string;
  attemptNumber: number;
  triggerKind: string;
  triggerPayload: unknown;
  spanId: string;
  parentSpanId: string;
  status: StageStatusValue;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
}

export interface AgentInvocationRecord extends AgentInvocationTrace {
  id: string;
  attemptExecutionId: string;
}

export interface ResolutionSampleRecord {
  id: string;
  taskId: string;
  attemptExecutionId: string;
  sampleIndex: number;
  branch: string;
  summary: string;
  filesChanged: string[];
  patch: string;
  additions: number;
  deletions: number;
  filterPassed: boolean;
  filterChecks: unknown;
  criticApproved: boolean | null;
  criticScore: number | null;
  criticConcerns: unknown;
  selected: boolean;
  createdAt: string;
}

export interface HumanReviewRecord {
  id: string;
  taskId: string;
  stageExecutionId: string;
  decisionType: 'BINARY' | 'TERNARY';
  action: string;
  feedback: string | null;
  userId: string | null;
  createdAt: string;
}

export interface RetrospectiveStats {
  totalDurationMs: number;
  perStage: Record<
    string,
    {
      durationMs: number;
      toolCallCount: number;
      agentInvocationCount: number;
      costUsd: number;
      inputTokens: number;
      outputTokens: number;
    }
  >;
  retryCount: number;
  sampleCount: number;
  reviewCount: number;
  totalCostUsd: number;
  toolHistogram: Record<string, number>;
}

export interface RetrospectiveBottleneck {
  stageName: string;
  durationMs: number;
  reason: string;
}

export interface RetrospectiveRecommendation {
  kind: 'performance' | 'reliability' | 'quality' | 'process';
  text: string;
  references?: string[];
}

export interface RetrospectiveRiskFactor {
  severity: 'info' | 'warning' | 'critical';
  text: string;
}

export interface RetrospectiveRecord {
  id: string;
  workflowExecutionId: string;
  summary: string | null;
  bottlenecks: RetrospectiveBottleneck[];
  recommendations: RetrospectiveRecommendation[];
  riskFactors: RetrospectiveRiskFactor[];
  stats: RetrospectiveStats;
  model: string | null;
  costUsd: number | null;
  createdAt: string;
}

// ── Span helpers ───────────────────────────────────────────

/**
 * Produces a 16-hex-character span id (OTel span_id shape).
 * Uses Web Crypto randomUUID, drops dashes, takes 16 chars.
 */
export function generateSpanId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

/**
 * Produces a 32-hex-character trace id (OTel trace_id shape).
 */
export function generateTraceId(): string {
  return (
    crypto.randomUUID().replace(/-/g, '') +
    crypto.randomUUID().replace(/-/g, '').slice(0, 0)
  ).slice(0, 32);
}

/**
 * Truncate a string to at most `capBytes` UTF-8 bytes. Returns the
 * original if under cap. Second return is the original byte size
 * when truncation happened; null otherwise.
 */
export function truncateToBytes(
  input: string,
  capBytes: number
): { text: string; truncatedAt: number | null } {
  const encoded = new TextEncoder().encode(input);
  if (encoded.length <= capBytes) return { text: input, truncatedAt: null };
  const truncated = new TextDecoder('utf-8', { fatal: false }).decode(
    encoded.slice(0, capBytes)
  );
  return { text: truncated, truncatedAt: encoded.length };
}
