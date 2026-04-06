import type {
  EventLevel,
  ExecutionStatus,
  LogLevel,
  StageStatus,
  TaskBadge,
  TaskStage,
} from '@torin/domain';

export interface StageDetail {
  status: StageStatus;
  duration: string;
  toolCalls: number;
  summary: string;
}

export interface TaskItem {
  id: string;
  title: string;
  status: ExecutionStatus;
  repo: string;
  branch: string;
  workflow: string;
  model: string;
  currentStage: TaskStage;
  stages: Record<TaskStage, StageStatus>;
  stageDetails: Record<TaskStage, StageDetail>;
  duration: string;
  cost: string;
  sandbox: string;
  badges: TaskBadge[];
  createdAt: string;
  projectName: string;
  triggerSource: string;
}

export interface TimelineEvent {
  timestamp: string;
  stage: TaskStage;
  event: string;
  level: EventLevel;
  agent?: string;
  tool?: string;
  details?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
}

export interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  header: string;
  lines: { type: 'add' | 'remove' | 'context'; content: string }[];
}

export interface CostBreakdown {
  stage: TaskStage;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  duration: string;
  model: string;
}

export interface ReplayStep {
  index: number;
  stage: TaskStage;
  action: string;
  input: string;
  output: string;
  model: string;
  tools: string[];
  duration: string;
  status: 'completed' | 'failed' | 'skipped';
}

export interface HealthAlert {
  type:
    | 'path_deviation'
    | 'missing_step'
    | 'test_failure'
    | 'blocked'
    | 'error';
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface TaskDetail {
  task: TaskItem;
  timeline: TimelineEvent[];
  logs: LogEntry[];
  diff: DiffFile[];
  cost: CostBreakdown[];
  replay: ReplayStep[];
  health: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    alerts: HealthAlert[];
    expectedPath: TaskStage[];
    actualPath: TaskStage[];
    missingSteps: string[];
  };
  summary: {
    description: string;
    issue: string;
    contextFiles: string[];
    outputs: string[];
    prUrl: string;
    testsPassed: number;
    testsFailed: number;
    confidence: number;
    pathDeviation: boolean;
    errorCount: number;
    retryCount: number;
    totalTokens: number;
    totalCost: string;
  };
  approvals: {
    id: string;
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    description: string;
    timestamp: string;
  }[];
}
