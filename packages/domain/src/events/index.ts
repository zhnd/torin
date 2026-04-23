/**
 * Typed domain events — the payload shape of `TaskEvent.payload` discriminated
 * by `TaskEvent.eventType`. Zod-validated before insert by
 * `recordTaskEventActivity`; consumed by UI dispatch on eventType.
 *
 * Adding a new event: add the eventType key, write a schema, append to
 * the discriminated union. No schema migration needed.
 */

import { z } from 'zod';

export const TASK_EVENT_TYPE = {
  Log: 'Log',
  ExecutionStarted: 'ExecutionStarted',
  ExecutionCompleted: 'ExecutionCompleted',
  ExecutionFailed: 'ExecutionFailed',
  StageStarted: 'StageStarted',
  StageCompleted: 'StageCompleted',
  StageFailed: 'StageFailed',
  StageSkipped: 'StageSkipped',
  AttemptStarted: 'AttemptStarted',
  AttemptCompleted: 'AttemptCompleted',
  AttemptFailed: 'AttemptFailed',
  AgentInvocationStarted: 'AgentInvocationStarted',
  AgentInvocationCompleted: 'AgentInvocationCompleted',
  AgentInvocationFailed: 'AgentInvocationFailed',
  AnalysisApproved: 'AnalysisApproved',
  SampleGenerated: 'SampleGenerated',
  SampleSelected: 'SampleSelected',
  HumanReviewRequested: 'HumanReviewRequested',
  HumanApproved: 'HumanApproved',
  HumanRejected: 'HumanRejected',
  PullRequestOpened: 'PullRequestOpened',
  RetrospectiveGenerated: 'RetrospectiveGenerated',
  SandboxProvisioningStarted: 'SandboxProvisioningStarted',
  SandboxReady: 'SandboxReady',
  SandboxDestroyed: 'SandboxDestroyed',
} as const;

export type TaskEventType = (typeof TASK_EVENT_TYPE)[keyof typeof TASK_EVENT_TYPE];

// ── Payload schemas (one per eventType) ─────────────────

const logPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.Log),
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string(),
  source: z.string().optional(),
  tool: z.string().optional(),
  details: z.string().optional(),
});

const executionStartedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.ExecutionStarted),
  workflowKind: z.string(),
  temporalWorkflowId: z.string().optional(),
});

const executionCompletedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.ExecutionCompleted),
  durationMs: z.number(),
});

const executionFailedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.ExecutionFailed),
  reason: z.string(),
});

const stageStartedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.StageStarted),
  stageName: z.string(),
});

const stageCompletedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.StageCompleted),
  stageName: z.string(),
  durationMs: z.number(),
});

const stageFailedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.StageFailed),
  stageName: z.string(),
  reason: z.string(),
});

const stageSkippedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.StageSkipped),
  stageName: z.string(),
  reason: z.string(),
});

const attemptStartedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.AttemptStarted),
  stageName: z.string(),
  attemptNumber: z.number(),
  triggerKind: z.string(),
});

const attemptCompletedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.AttemptCompleted),
  stageName: z.string(),
  attemptNumber: z.number(),
  durationMs: z.number(),
});

const attemptFailedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.AttemptFailed),
  stageName: z.string(),
  attemptNumber: z.number(),
  reason: z.string(),
});

const agentInvocationStartedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.AgentInvocationStarted),
  agentName: z.string(),
  model: z.string(),
});

const agentInvocationCompletedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.AgentInvocationCompleted),
  agentName: z.string(),
  model: z.string(),
  durationMs: z.number(),
  totalCostUsd: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
});

const agentInvocationFailedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.AgentInvocationFailed),
  agentName: z.string(),
  errorText: z.string(),
});

const analysisApprovedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.AnalysisApproved),
  autoApproved: z.boolean(),
  riskClass: z.string().optional(),
});

const sampleGeneratedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.SampleGenerated),
  sampleId: z.string(),
  sampleIndex: z.number(),
  filterPassed: z.boolean(),
  criticScore: z.number().nullable().optional(),
});

const sampleSelectedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.SampleSelected),
  sampleId: z.string(),
  sampleIndex: z.number(),
  criticScore: z.number().nullable().optional(),
});

const humanReviewRequestedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.HumanReviewRequested),
  stageName: z.string(),
});

const humanApprovedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.HumanApproved),
  stageName: z.string(),
  feedback: z.string().optional(),
  userId: z.string().nullable().optional(),
});

const humanRejectedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.HumanRejected),
  stageName: z.string(),
  feedback: z.string().optional(),
  userId: z.string().nullable().optional(),
});

const pullRequestOpenedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.PullRequestOpened),
  url: z.string(),
  number: z.number(),
});

const retrospectiveGeneratedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.RetrospectiveGenerated),
  model: z.string().nullable(),
  costUsd: z.number().nullable().optional(),
});

const sandboxProvisioningStartedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.SandboxProvisioningStarted),
  repositoryUrl: z.string(),
});

const sandboxReadyPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.SandboxReady),
  durationMs: z.number().optional(),
});

const sandboxDestroyedPayload = z.object({
  eventType: z.literal(TASK_EVENT_TYPE.SandboxDestroyed),
});

export const taskEventPayloadSchema = z.discriminatedUnion('eventType', [
  logPayload,
  executionStartedPayload,
  executionCompletedPayload,
  executionFailedPayload,
  stageStartedPayload,
  stageCompletedPayload,
  stageFailedPayload,
  stageSkippedPayload,
  attemptStartedPayload,
  attemptCompletedPayload,
  attemptFailedPayload,
  agentInvocationStartedPayload,
  agentInvocationCompletedPayload,
  agentInvocationFailedPayload,
  analysisApprovedPayload,
  sampleGeneratedPayload,
  sampleSelectedPayload,
  humanReviewRequestedPayload,
  humanApprovedPayload,
  humanRejectedPayload,
  pullRequestOpenedPayload,
  retrospectiveGeneratedPayload,
  sandboxProvisioningStartedPayload,
  sandboxReadyPayload,
  sandboxDestroyedPayload,
]);

export type TaskEventPayload = z.infer<typeof taskEventPayloadSchema>;

/**
 * Parsed TaskEvent record that UI consumers receive. `payload` is
 * narrowed by `eventType` via the discriminated union above.
 */
export interface TaskEventRecord {
  id: string;
  taskId: string;
  eventType: TaskEventType | string;
  payload: TaskEventPayload | unknown;
  workflowExecutionId: string | null;
  stageExecutionId: string | null;
  attemptExecutionId: string | null;
  traceId: string | null;
  spanId: string | null;
  occurredAt: string;
}
