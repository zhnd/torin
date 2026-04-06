export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

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
