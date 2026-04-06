export type TaskStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'AWAITING_REVIEW'
  | 'COMPLETED'
  | 'FAILED';

export type TaskStage = 'analysis' | 'plan' | 'implement' | 'test' | 'pr';
export type StageStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'blocked'
  | 'needs_review'
  | 'completed'
  | 'failed';

export type TaskBadge = 'path_deviation' | 'needs_review' | 'failed';

export const TASK_STAGES: TaskStage[] = [
  'analysis',
  'plan',
  'implement',
  'test',
  'pr',
];

// ── Observability types ─────────────────────────────────

export interface ObservedEvent {
  stage: string;
  event: string;
  level: 'info' | 'warn' | 'error';
  agent?: string;
  tool?: string;
  details?: string;
  timestamp: string;
}

export interface AgentCost {
  totalCostUsd: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  model: string;
}

export interface AgentObservation {
  events: ObservedEvent[];
  cost: AgentCost | null;
}
