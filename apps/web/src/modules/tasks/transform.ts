import type { EventLevel, StageStatus, TaskStage } from '@torin/domain';
import type {
  CostBreakdown,
  DiffFile,
  HealthAlert,
  StageDetail,
  TaskDetail,
  TaskItem,
  TimelineEvent,
} from './types';

// ── API response shape ──────────────────────────────────

interface ApiEvent {
  id: string;
  stage: string;
  event: string;
  level: string;
  agent?: string | null;
  tool?: string | null;
  details?: string | null;
  timestamp: string;
}

interface ApiTask {
  id: string;
  type: string;
  status: string;
  repositoryUrl: string;
  result?: Record<string, unknown> | null;
  error?: string | null;
  workflowId?: string | null;
  currentStage?: string | null;
  stages?: Record<string, string> | null;
  totalCostUsd?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  durationMs?: number | null;
  model?: string | null;
  costBreakdown?: Array<{
    stage: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    duration: string;
    model: string;
  }> | null;
  events?: ApiEvent[];
  project?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

// ── Status mapping ──────────────────────────────────────

type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'blocked'
  | 'needs_review'
  | 'completed'
  | 'failed';

function mapStatus(status: string): ExecutionStatus {
  switch (status) {
    case 'PENDING':
      return 'queued';
    case 'RUNNING':
      return 'running';
    case 'AWAITING_REVIEW':
      return 'needs_review';
    case 'COMPLETED':
      return 'completed';
    case 'FAILED':
      return 'failed';
    default:
      return 'queued';
  }
}

// ── Stage details from events ───────────────────────────

const ALL_STAGES: TaskStage[] = ['analysis', 'plan', 'implement', 'test', 'pr'];

function buildStageDetails(
  stages: Record<string, string> | null | undefined,
  events: ApiEvent[]
): {
  stagesMap: Record<TaskStage, StageStatus>;
  stageDetails: Record<TaskStage, StageDetail>;
} {
  const stagesMap = {} as Record<TaskStage, StageStatus>;
  const stageDetails = {} as Record<TaskStage, StageDetail>;

  for (const stage of ALL_STAGES) {
    const status = (stages?.[stage] ?? 'pending') as StageStatus;
    stagesMap[stage] = status;

    const stageEvents = events.filter((e) => e.stage === stage);
    const toolCalls = stageEvents.filter((e) => e.tool).length;

    let duration = '—';
    if (stageEvents.length >= 2) {
      const first = new Date(stageEvents[0].timestamp).getTime();
      const last = new Date(
        stageEvents[stageEvents.length - 1].timestamp
      ).getTime();
      const diffMs = last - first;
      duration = formatDuration(diffMs);
    }

    const summary =
      stageEvents.length > 0 ? stageEvents[stageEvents.length - 1].event : '';

    stageDetails[stage] = { status, duration, toolCalls, summary };
  }

  return { stagesMap, stageDetails };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// ── Transform ───────────────────────────────────────────

export function transformTaskToItem(apiTask: ApiTask): TaskItem {
  const events = apiTask.events ?? [];
  const { stagesMap, stageDetails } = buildStageDetails(apiTask.stages, events);

  const totalTokens = (apiTask.inputTokens ?? 0) + (apiTask.outputTokens ?? 0);
  const totalCost = apiTask.totalCostUsd
    ? `$${apiTask.totalCostUsd.toFixed(4)}`
    : '$0';

  return {
    id: apiTask.id,
    title: apiTask.type.replace(/_/g, ' '),
    status: mapStatus(apiTask.status),
    repo: apiTask.repositoryUrl,
    branch: '',
    workflow: apiTask.type,
    model: apiTask.model ?? '',
    currentStage: (apiTask.currentStage ?? 'analysis') as TaskStage,
    stages: stagesMap,
    stageDetails,
    duration: apiTask.durationMs ? formatDuration(apiTask.durationMs) : '—',
    cost: totalCost,
    sandbox: '',
    badges: [],
    createdAt: apiTask.createdAt,
    projectName: apiTask.project?.name ?? '',
    triggerSource: 'manual',
  };
}

export function transformTaskToDetail(apiTask: ApiTask): TaskDetail {
  const task = transformTaskToItem(apiTask);
  const events = apiTask.events ?? [];

  const totalTokens = (apiTask.inputTokens ?? 0) + (apiTask.outputTokens ?? 0);
  const totalCost = apiTask.totalCostUsd
    ? `$${apiTask.totalCostUsd.toFixed(4)}`
    : '$0';

  // Timeline events
  const timeline: TimelineEvent[] = events.map((e) => ({
    timestamp: e.timestamp,
    stage: e.stage as TaskStage,
    event: e.event,
    level: (e.level ?? 'info') as EventLevel,
    agent: e.agent ?? undefined,
    tool: e.tool ?? undefined,
    details: e.details ?? undefined,
  }));

  // Cost breakdown
  const cost: CostBreakdown[] = (apiTask.costBreakdown ?? []).map((c) => ({
    stage: c.stage as TaskStage,
    inputTokens: c.inputTokens,
    outputTokens: c.outputTokens,
    cost: c.cost,
    duration: c.duration,
    model: c.model,
  }));

  // Diff from result
  const diff: DiffFile[] = [];
  if (apiTask.result?.diff && Array.isArray(apiTask.result.diff)) {
    for (const d of apiTask.result.diff as Array<Record<string, unknown>>) {
      diff.push({
        path: String(d.file ?? ''),
        additions: Number(d.additions ?? 0),
        deletions: Number(d.deletions ?? 0),
        hunks: parsePatchToHunks(String(d.patch ?? '')),
      });
    }
  }

  // Health
  const completedStages = ALL_STAGES.filter(
    (s) => task.stages[s] === 'completed'
  );
  const failedStages = ALL_STAGES.filter((s) => task.stages[s] === 'failed');
  const alerts: HealthAlert[] = failedStages.map((s) => ({
    type: 'error' as const,
    severity: 'warning' as const,
    message: `Stage "${s}" failed`,
  }));

  return {
    task,
    timeline,
    logs: [],
    diff,
    cost,
    replay: [],
    health: {
      riskLevel: failedStages.length > 0 ? 'medium' : 'low',
      alerts,
      expectedPath: ALL_STAGES,
      actualPath: completedStages,
      missingSteps: [],
    },
    summary: {
      description: apiTask.type.replace(/_/g, ' '),
      issue: '',
      contextFiles: [],
      outputs: [],
      prUrl: (
        apiTask.result?.pullRequest as Record<string, unknown> | undefined
      )?.url
        ? String((apiTask.result?.pullRequest as Record<string, unknown>).url)
        : '',
      testsPassed: 0,
      testsFailed: 0,
      confidence: 0,
      pathDeviation: false,
      errorCount: failedStages.length,
      retryCount: 0,
      totalTokens,
      totalCost,
    },
    approvals: [],
  };
}

function parsePatchToHunks(patch: string): DiffFile['hunks'] {
  if (!patch) return [];
  const lines = patch.split('\n');
  const hunks: DiffFile['hunks'] = [];
  let currentHunk: DiffFile['hunks'][number] | null = null;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      if (currentHunk) hunks.push(currentHunk);
      currentHunk = { header: line, lines: [] };
    } else if (currentHunk) {
      if (line.startsWith('+')) {
        currentHunk.lines.push({ type: 'add', content: line.slice(1) });
      } else if (line.startsWith('-')) {
        currentHunk.lines.push({ type: 'remove', content: line.slice(1) });
      } else {
        currentHunk.lines.push({
          type: 'context',
          content: line.startsWith(' ') ? line.slice(1) : line,
        });
      }
    }
  }
  if (currentHunk) hunks.push(currentHunk);
  return hunks;
}
