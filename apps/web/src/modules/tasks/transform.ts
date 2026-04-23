import type { EventLevel, StageStatus, TaskStage } from '@torin/domain';
import type {
  AgentInvocationView,
  AttemptView,
  CostBreakdown,
  DiffFile,
  ExecutionView,
  HealthAlert,
  RetrospectiveView,
  ReviewView,
  SampleView,
  StageDetail,
  StageView,
  TaskDetail,
  TaskItem,
  TimelineEvent,
  ToolCallView,
  TurnView,
} from './types';

// ── API response shapes ─────────────────────────────────────

interface ApiEvent {
  id: string;
  eventType?: string;
  payload?: unknown;
  stage?: string | null;
  event?: string | null;
  level?: string | null;
  agent?: string | null;
  tool?: string | null;
  details?: string | null;
  timestamp: string;
  occurredAt?: string | null;
  workflowExecutionId?: string | null;
  stageExecutionId?: string | null;
  attemptExecutionId?: string | null;
  spanId?: string | null;
}

interface ApiToolCall {
  id: string;
  agentTurnId: string | null;
  toolUseId: string;
  name: string;
  input: unknown;
  output: string | null;
  outputTruncatedAt: number | null;
  success: boolean | null;
  errorText: string | null;
  spanId: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
}

interface ApiTurn {
  id: string;
  turnIndex: number;
  role: string;
  textContent: string | null;
  textTruncatedAt: number | null;
  toolUseCount: number;
  inputTokens: number | null;
  outputTokens: number | null;
  startedAt: string;
}

interface ApiInvocation {
  id: string;
  agentName: string;
  model: string;
  status: string;
  errorText: string | null;
  spanId: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  totalCostUsd: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  turns: ApiTurn[];
  toolCalls: ApiToolCall[];
}

interface ApiSample {
  id: string;
  attemptExecutionId?: string;
  sampleIndex: number;
  branch: string;
  summary?: string;
  filesChanged?: string[];
  patch?: string;
  additions?: number;
  deletions?: number;
  filterPassed: boolean;
  filterChecks?: unknown;
  criticApproved?: boolean | null;
  criticScore: number | null;
  criticConcerns?: unknown;
  selected: boolean;
  createdAt: string;
}

interface ApiReview {
  id: string;
  stageExecutionId?: string;
  decisionType?: string;
  action: string;
  feedback: string | null;
  userId: string | null;
  createdAt: string;
}

interface ApiAttempt {
  id: string;
  attemptNumber: number;
  triggerKind: string;
  triggerPayload: unknown;
  spanId: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  invocations: ApiInvocation[];
  samples: ApiSample[];
}

interface ApiStage {
  id: string;
  stageName: string;
  order: number;
  status: string;
  spanId: string;
  parentSpanId: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  attempts: ApiAttempt[];
  reviews: ApiReview[];
}

interface ApiRetrospective {
  id: string;
  summary: string | null;
  bottlenecks: unknown;
  recommendations: unknown;
  riskFactors: unknown;
  stats: unknown;
  model: string | null;
  costUsd: number | null;
  createdAt: string;
}

interface ApiExecution {
  id: string;
  workflowKind: string;
  workflowVersion: number;
  traceId: string;
  temporalWorkflowId?: string | null;
  status: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  stages: ApiStage[];
  retrospective: ApiRetrospective | null;
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
  executions?: ApiExecution[];
  samples?: ApiSample[];
  reviews?: ApiReview[];
  project?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

// ── Status mapping ──────────────────────────────────────────

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

// ── Stage details from StageExecution or legacy event scan ──

const KNOWN_STAGES: TaskStage[] = [
  'analysis',
  'plan',
  'implement',
  'test',
  'pr',
];

function buildStageDetailsFromExecution(exec: ApiExecution | null): {
  stagesMap: Record<TaskStage, StageStatus>;
  stageDetails: Record<TaskStage, StageDetail>;
} {
  const stagesMap = {} as Record<TaskStage, StageStatus>;
  const stageDetails = {} as Record<TaskStage, StageDetail>;
  if (!exec) return { stagesMap, stageDetails };
  for (const s of exec.stages) {
    const key = s.stageName as TaskStage;
    const status = normalizeStatus(s.status);
    stagesMap[key] = status;
    const toolCallCount = s.attempts.reduce(
      (sum, a) =>
        sum +
        a.invocations.reduce((acc, inv) => acc + inv.toolCalls.length, 0),
      0
    );
    stageDetails[key] = {
      status,
      duration: s.durationMs ? formatDuration(s.durationMs) : '—',
      toolCalls: toolCallCount,
      summary: '',
    };
  }
  return { stagesMap, stageDetails };
}

function buildStageDetailsFromLegacy(
  stages: Record<string, string> | null | undefined,
  events: ApiEvent[]
): {
  stagesMap: Record<TaskStage, StageStatus>;
  stageDetails: Record<TaskStage, StageDetail>;
} {
  const stagesMap = {} as Record<TaskStage, StageStatus>;
  const stageDetails = {} as Record<TaskStage, StageDetail>;

  for (const stage of KNOWN_STAGES) {
    const status = normalizeStatus(stages?.[stage] ?? 'pending');
    stagesMap[stage] = status;

    const stageEvents = events.filter(
      (e) => (e.stage ?? e.stageExecutionId) === stage
    );
    const toolCalls = stageEvents.filter((e) => e.tool).length;

    let duration = '—';
    if (stageEvents.length >= 2) {
      const first = new Date(
        stageEvents[0].occurredAt ?? stageEvents[0].timestamp
      ).getTime();
      const last = new Date(
        stageEvents[stageEvents.length - 1].occurredAt ??
          stageEvents[stageEvents.length - 1].timestamp
      ).getTime();
      duration = formatDuration(last - first);
    }

    const summary =
      stageEvents.length > 0
        ? (stageEvents[stageEvents.length - 1].event ?? '')
        : '';

    stageDetails[stage] = { status, duration, toolCalls, summary };
  }

  return { stagesMap, stageDetails };
}

function normalizeStatus(raw: string): StageStatus {
  const v = raw.toLowerCase();
  if (
    v === 'pending' ||
    v === 'running' ||
    v === 'completed' ||
    v === 'failed' ||
    v === 'skipped'
  ) {
    return v;
  }
  if (v === 'awaiting' || v === 'awaiting_review') return 'running';
  return 'pending';
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// ── Transform ──────────────────────────────────────────────

export function transformTaskToItem(apiTask: ApiTask): TaskItem {
  const events = apiTask.events ?? [];
  const currentExec = pickCurrentExecution(apiTask.executions ?? []);
  const { stagesMap, stageDetails } = currentExec
    ? buildStageDetailsFromExecution(currentExec)
    : buildStageDetailsFromLegacy(apiTask.stages, events);

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
    currentStage: (apiTask.currentStage ??
      currentExec?.stages.find((s) => s.status === 'RUNNING')?.stageName ??
      'analysis') as TaskStage,
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

function pickCurrentExecution(
  executions: ApiExecution[]
): ApiExecution | null {
  if (executions.length === 0) return null;
  // The GraphQL query orders desc by startedAt, so [0] is the most recent.
  return executions[0];
}

export function transformTaskToDetail(apiTask: ApiTask): TaskDetail {
  const task = transformTaskToItem(apiTask);
  const events = apiTask.events ?? [];
  const executions = (apiTask.executions ?? []).map(mapExecution);
  const currentExecution = executions[0] ?? null;

  const totalTokens = (apiTask.inputTokens ?? 0) + (apiTask.outputTokens ?? 0);
  const totalCost = apiTask.totalCostUsd
    ? `$${apiTask.totalCostUsd.toFixed(4)}`
    : '$0';

  const timeline: TimelineEvent[] = events.map(mapEvent);

  // Cost breakdown: prefer denormalized execution data when available,
  // fall back to legacy JSON. This keeps the same UI working during
  // the transition window.
  let cost: CostBreakdown[] = [];
  if (currentExecution) {
    cost = buildCostFromExecution(currentExecution);
  } else if (apiTask.costBreakdown && apiTask.costBreakdown.length > 0) {
    cost = apiTask.costBreakdown.map((c) => ({
      stage: c.stage as TaskStage,
      inputTokens: c.inputTokens,
      outputTokens: c.outputTokens,
      cost: c.cost,
      duration: c.duration,
      model: c.model,
    }));
  }

  const diff: DiffFile[] = extractDiffFromResult(apiTask.result);

  const failedStages = KNOWN_STAGES.filter(
    (s) => task.stages[s] === 'failed'
  );
  const completedStages = KNOWN_STAGES.filter(
    (s) => task.stages[s] === 'completed'
  );
  const alerts: HealthAlert[] = failedStages.map((s) => ({
    type: 'error' as const,
    severity: 'warning' as const,
    message: `Stage "${s}" failed`,
  }));

  const samples: SampleView[] = (apiTask.samples ?? []).map(mapSampleShallow);
  const reviews: ReviewView[] = (apiTask.reviews ?? []).map(mapReview);

  const prUrl = (
    apiTask.result?.pullRequest as Record<string, unknown> | undefined
  )?.url
    ? String((apiTask.result?.pullRequest as Record<string, unknown>).url)
    : '';

  const retryCount =
    currentExecution?.stages.reduce(
      (acc, s) => acc + Math.max(0, s.attempts.length - 1),
      0
    ) ?? 0;

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
      expectedPath: KNOWN_STAGES,
      actualPath: completedStages,
      missingSteps: [],
    },
    summary: {
      description: apiTask.type.replace(/_/g, ' '),
      issue: '',
      contextFiles: [],
      outputs: [],
      prUrl,
      testsPassed: 0,
      testsFailed: 0,
      confidence: 0,
      pathDeviation: false,
      errorCount: failedStages.length,
      retryCount,
      totalTokens,
      totalCost,
    },
    approvals: [],
    currentExecution,
    executions,
    samples,
    reviews,
  };
}

// ── Sub-mappers ──────────────────────────────────────────────

function mapEvent(e: ApiEvent): TimelineEvent {
  return {
    timestamp: e.occurredAt ?? e.timestamp,
    stage: (e.stage ?? deriveStageFromEventType(e.eventType)) as TaskStage,
    event: e.event ?? e.eventType ?? 'event',
    level: (e.level ?? 'info') as EventLevel,
    agent: e.agent ?? undefined,
    tool: e.tool ?? undefined,
    details: e.details ?? undefined,
    eventType: e.eventType,
    payload: e.payload,
    stageExecutionId: e.stageExecutionId ?? null,
    attemptExecutionId: e.attemptExecutionId ?? null,
    spanId: e.spanId ?? null,
  };
}

function deriveStageFromEventType(eventType: string | undefined): string {
  if (!eventType) return 'analysis';
  if (eventType.startsWith('Analysis')) return 'analysis';
  if (eventType.startsWith('Sample')) return 'implement';
  if (eventType.startsWith('Human')) return 'critic';
  if (eventType.startsWith('PullRequest')) return 'pr';
  return 'analysis';
}

function mapExecution(e: ApiExecution): ExecutionView {
  return {
    id: e.id,
    workflowKind: e.workflowKind,
    workflowVersion: e.workflowVersion,
    traceId: e.traceId,
    status: e.status,
    startedAt: e.startedAt,
    endedAt: e.endedAt,
    durationMs: e.durationMs,
    stages: e.stages.map(mapStage),
    retrospective: e.retrospective ? mapRetrospective(e.retrospective) : null,
  };
}

function mapStage(s: ApiStage): StageView {
  return {
    id: s.id,
    stageName: s.stageName,
    order: s.order,
    status: s.status,
    spanId: s.spanId,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    durationMs: s.durationMs,
    attempts: s.attempts.map(mapAttempt),
    reviews: s.reviews.map(mapReview),
  };
}

function mapAttempt(a: ApiAttempt): AttemptView {
  return {
    id: a.id,
    attemptNumber: a.attemptNumber,
    triggerKind: a.triggerKind,
    triggerPayload: a.triggerPayload,
    spanId: a.spanId,
    status: a.status,
    startedAt: a.startedAt,
    endedAt: a.endedAt,
    durationMs: a.durationMs,
    invocations: a.invocations.map(mapInvocation),
    samples: a.samples.map(mapSample),
  };
}

function mapInvocation(i: ApiInvocation): AgentInvocationView {
  return {
    id: i.id,
    agentName: i.agentName,
    model: i.model,
    status: i.status,
    errorText: i.errorText,
    spanId: i.spanId,
    startedAt: i.startedAt,
    endedAt: i.endedAt,
    durationMs: i.durationMs,
    totalCostUsd: i.totalCostUsd,
    inputTokens: i.inputTokens,
    outputTokens: i.outputTokens,
    turns: i.turns.map(mapTurn),
    toolCalls: i.toolCalls.map(mapToolCall),
  };
}

function mapTurn(t: ApiTurn): TurnView {
  return {
    id: t.id,
    turnIndex: t.turnIndex,
    role: t.role,
    textContent: t.textContent,
    textTruncatedAt: t.textTruncatedAt,
    toolUseCount: t.toolUseCount,
    inputTokens: t.inputTokens,
    outputTokens: t.outputTokens,
    startedAt: t.startedAt,
  };
}

function mapToolCall(tc: ApiToolCall): ToolCallView {
  return {
    id: tc.id,
    agentTurnId: tc.agentTurnId,
    toolUseId: tc.toolUseId,
    name: tc.name,
    input: tc.input,
    output: tc.output,
    outputTruncatedAt: tc.outputTruncatedAt,
    success: tc.success,
    errorText: tc.errorText,
    spanId: tc.spanId,
    startedAt: tc.startedAt,
    endedAt: tc.endedAt,
    durationMs: tc.durationMs,
  };
}

function mapSample(s: ApiSample): SampleView {
  return {
    id: s.id,
    attemptExecutionId: s.attemptExecutionId ?? '',
    sampleIndex: s.sampleIndex,
    branch: s.branch,
    summary: s.summary ?? '',
    filesChanged: s.filesChanged ?? [],
    patch: s.patch ?? '',
    additions: s.additions ?? 0,
    deletions: s.deletions ?? 0,
    filterPassed: s.filterPassed,
    filterChecks: s.filterChecks,
    criticApproved: s.criticApproved ?? null,
    criticScore: s.criticScore,
    criticConcerns: s.criticConcerns,
    selected: s.selected,
    createdAt: s.createdAt,
  };
}

/**
 * Task-level samples (flat list) come back with fewer fields than
 * samples nested under an attempt. This maps the shallow shape.
 */
function mapSampleShallow(s: ApiSample): SampleView {
  return mapSample(s);
}

function mapReview(r: ApiReview): ReviewView {
  return {
    id: r.id,
    stageExecutionId: r.stageExecutionId ?? '',
    decisionType: r.decisionType ?? 'BINARY',
    action: r.action,
    feedback: r.feedback,
    userId: r.userId,
    createdAt: r.createdAt,
  };
}

function mapRetrospective(r: ApiRetrospective): RetrospectiveView {
  return {
    id: r.id,
    summary: r.summary,
    bottlenecks: Array.isArray(r.bottlenecks)
      ? (r.bottlenecks as RetrospectiveView['bottlenecks'])
      : [],
    recommendations: Array.isArray(r.recommendations)
      ? (r.recommendations as RetrospectiveView['recommendations'])
      : [],
    riskFactors: Array.isArray(r.riskFactors)
      ? (r.riskFactors as RetrospectiveView['riskFactors'])
      : [],
    stats: (r.stats as RetrospectiveView['stats']) ?? {
      totalDurationMs: 0,
      perStage: {},
      retryCount: 0,
      sampleCount: 0,
      reviewCount: 0,
      totalCostUsd: 0,
      toolHistogram: {},
    },
    model: r.model,
    costUsd: r.costUsd,
    createdAt: r.createdAt,
  };
}

function buildCostFromExecution(exec: ExecutionView): CostBreakdown[] {
  return exec.stages
    .filter((s) => s.attempts.some((a) => a.invocations.length > 0))
    .map((s) => {
      let inputTokens = 0;
      let outputTokens = 0;
      let cost = 0;
      let model = '';
      let totalDurationMs = 0;
      for (const attempt of s.attempts) {
        for (const inv of attempt.invocations) {
          inputTokens += inv.inputTokens ?? 0;
          outputTokens += inv.outputTokens ?? 0;
          cost += inv.totalCostUsd ?? 0;
          totalDurationMs += inv.durationMs ?? 0;
          if (!model && inv.model) model = inv.model;
        }
      }
      return {
        stage: s.stageName as TaskStage,
        inputTokens,
        outputTokens,
        cost,
        duration: formatDuration(totalDurationMs),
        model,
      };
    });
}

function extractDiffFromResult(
  result: Record<string, unknown> | null | undefined
): DiffFile[] {
  if (!result?.diff || !Array.isArray(result.diff)) return [];
  const out: DiffFile[] = [];
  for (const d of result.diff as Array<Record<string, unknown>>) {
    out.push({
      path: String(d.file ?? ''),
      additions: Number(d.additions ?? 0),
      deletions: Number(d.deletions ?? 0),
      hunks: parsePatchToHunks(String(d.patch ?? '')),
    });
  }
  return out;
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
