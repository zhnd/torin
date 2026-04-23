import { StageTag } from '@/components/common/stage-tag';
import type { TaskDetail } from '../../types';

export interface TimelineSegment {
  stage: StageKey;
  attempt: number;
  status: 'done' | 'rejected' | 'failed' | 'awaiting' | 'running';
  t0: number; // seconds from task start
  t1: number;
  label?: string;
}

type StageKey =
  | 'analyze'
  | 'reproduce'
  | 'implement'
  | 'filter'
  | 'critic'
  | 'hitl'
  | 'pr';

const STAGE_LIST: { key: StageKey; abbr: string; label: string }[] = [
  { key: 'analyze', abbr: 'ANL', label: 'Analyze' },
  { key: 'reproduce', abbr: 'RPR', label: 'Reproduce' },
  { key: 'implement', abbr: 'IMP', label: 'Implement' },
  { key: 'filter', abbr: 'FIL', label: 'Filter' },
  { key: 'critic', abbr: 'CRT', label: 'Critic' },
  { key: 'hitl', abbr: 'RVW', label: 'HITL-final' },
  { key: 'pr', abbr: ' PR', label: 'Pull request' },
];

const STATUS_COLOR: Record<TimelineSegment['status'], string> = {
  done: 'var(--foreground)',
  rejected: 'var(--warn)',
  failed: 'var(--danger)',
  awaiting: 'var(--accent)',
  running: 'var(--accent)',
};

/**
 * Visual tab body — 4 metric cards + pipeline Gantt + per-stage
 * breakdown bars. Data source: task.timeline (future) or mock when
 * empty. Currently renders mocked segments for a typical awaiting-HITL
 * task; replace `deriveSegments` with real event-grouping logic once
 * workflow events expose attempt boundaries.
 */
export function VisualView({ detail }: { detail: TaskDetail }) {
  const segments = deriveSegments(detail);
  const wallMs = wallTime(segments);
  const stagesDone = countDone(segments);
  const stagesSkipped =
    7 - stagesDone - (currentStageRunning(segments) ? 1 : 0);
  const retries = countRetries(segments);
  const current = currentStage(segments);
  const perStage = perStageSummary(segments, wallMs);

  return (
    <div className="flex flex-col gap-5 pb-12">
      {/* 4 metric cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricBlock
          label="Wall time"
          value={formatDuration(wallMs)}
          emphasize
        />
        <MetricBlock
          label="Stages"
          value={`${stagesDone} / 7`}
          hint={stagesSkipped > 0 ? `${stagesSkipped} skipped` : undefined}
        />
        <MetricBlock
          label="Retries"
          value={String(retries)}
          hint="rework cycles"
          color={retries > 0 ? 'var(--warn)' : undefined}
        />
        <MetricBlock
          label="Current"
          value={current?.label ?? '—'}
          hint={current?.subtitle}
          color={current?.tone}
        />
      </div>

      {/* Pipeline timeline (Gantt) */}
      <GanttPanel segments={segments} wallSeconds={Math.ceil(wallMs / 1000)} />

      {/* Per-stage breakdown */}
      <BreakdownPanel rows={perStage} />
    </div>
  );
}

// ── Metric card ──────────────────────────────────────────────────────

function MetricBlock({
  label,
  value,
  hint,
  emphasize,
  color,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
  color?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-5 py-4">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-foreground-subtle">
        {label}
      </div>
      <div
        className="mt-2.5 font-mono font-bold leading-none tabular-nums tracking-[-0.02em]"
        style={{
          color: color ?? 'var(--foreground)',
          fontSize: emphasize ? '32px' : '30px',
        }}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-2 text-[11.5px] text-foreground-subtle">{hint}</div>
      )}
    </div>
  );
}

// ── Gantt ────────────────────────────────────────────────────────────

const GANTT_ROW_HEIGHT = 32;
const GANTT_LEFT_GUTTER = 120;
const GANTT_TOP_PAD = 32;
const GANTT_SEGMENT_HEIGHT = 18;

function GanttPanel({
  segments,
  wallSeconds,
}: {
  segments: TimelineSegment[];
  wallSeconds: number;
}) {
  const height = GANTT_TOP_PAD + STAGE_LIST.length * GANTT_ROW_HEIGHT + 12;

  // Tick marks at every 5 minutes (or adapt to total length).
  const tickInterval = wallSeconds > 600 ? 300 : wallSeconds > 120 ? 60 : 30;
  const ticks: number[] = [];
  for (let t = 0; t <= wallSeconds; t += tickInterval) ticks.push(t);
  if (ticks[ticks.length - 1] !== wallSeconds) ticks.push(wallSeconds);

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="text-[13px] font-semibold">Pipeline timeline</span>
        <span className="text-[11.5px] text-foreground-subtle">
          {segments.length} segments · click a stage to inspect
        </span>
        <span className="flex-1" />
        <Legend />
      </div>
      <div className="overflow-x-auto p-4">
        <svg
          viewBox={`0 0 1000 ${height}`}
          width="100%"
          height={height}
          style={{ display: 'block' }}
          role="img"
          aria-hidden="true"
        >
          {/* Tick marks */}
          {ticks.map((t) => {
            const x = xAt(t, wallSeconds);
            return (
              <g key={`t-${t}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={GANTT_TOP_PAD - 6}
                  y2={height - 8}
                  stroke="var(--border)"
                  strokeDasharray={t === 0 || t === wallSeconds ? '' : '2 3'}
                />
                <text
                  x={x}
                  y={GANTT_TOP_PAD - 12}
                  textAnchor="middle"
                  fill="var(--foreground-subtle)"
                  fontFamily="var(--font-mono)"
                  fontSize="10.5"
                >
                  {formatClockFromSeconds(t)}
                </text>
              </g>
            );
          })}
          {/* Rows */}
          {STAGE_LIST.map((s, i) => {
            const y = GANTT_TOP_PAD + i * GANTT_ROW_HEIGHT;
            return (
              <g key={s.key}>
                {/* Y-axis label */}
                <text
                  x={0}
                  y={y + GANTT_SEGMENT_HEIGHT / 2 + 4}
                  fill="var(--foreground-subtle)"
                  fontFamily="var(--font-mono)"
                  fontSize="10.5"
                  fontWeight="600"
                  letterSpacing="0.05em"
                >
                  {s.abbr}
                </text>
                <text
                  x={40}
                  y={y + GANTT_SEGMENT_HEIGHT / 2 + 4}
                  fill="var(--foreground)"
                  fontFamily="var(--font-sans)"
                  fontSize="11.5"
                >
                  {s.label}
                </text>
                {/* Horizontal guide line */}
                <line
                  x1={GANTT_LEFT_GUTTER}
                  x2={1000}
                  y1={y + GANTT_SEGMENT_HEIGHT / 2}
                  y2={y + GANTT_SEGMENT_HEIGHT / 2}
                  stroke="var(--border)"
                  opacity={0.5}
                />
                {/* Segments for this row */}
                {/* biome-ignore lint/suspicious/noArrayIndexKey: segments ordered by time */}
                {segments
                  .filter((seg) => seg.stage === s.key)
                  .map((seg, j) => (
                    <Segment
                      key={`${s.key}-${j}`}
                      seg={seg}
                      y={y}
                      wallSeconds={wallSeconds}
                    />
                  ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function Segment({
  seg,
  y,
  wallSeconds,
}: {
  seg: TimelineSegment;
  y: number;
  wallSeconds: number;
}) {
  const x = xAt(seg.t0, wallSeconds);
  const width = Math.max(xAt(seg.t1, wallSeconds) - x, 14);
  const fill = STATUS_COLOR[seg.status];
  const showLabel = width > 70 && seg.label;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={GANTT_SEGMENT_HEIGHT}
        rx={3}
        fill={fill}
        opacity={seg.status === 'awaiting' ? 0.75 : 1}
      />
      {seg.status === 'awaiting' && (
        <rect
          x={x}
          y={y}
          width={width}
          height={GANTT_SEGMENT_HEIGHT}
          rx={3}
          fill="url(#awaiting-stripe)"
          opacity={0.35}
        />
      )}
      {showLabel && (
        <text
          x={x + 8}
          y={y + GANTT_SEGMENT_HEIGHT / 2 + 3.5}
          fill="var(--background)"
          fontFamily="var(--font-mono)"
          fontSize="10.5"
          fontWeight="500"
        >
          {seg.attempt > 1 ? `#${seg.attempt} · ${seg.label}` : seg.label}
        </text>
      )}
      <defs>
        <pattern
          id="awaiting-stripe"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <rect width="3" height="6" fill="white" opacity="0.4" />
        </pattern>
      </defs>
    </g>
  );
}

function Legend() {
  const entries: { label: string; color: string }[] = [
    { label: 'Done', color: 'var(--foreground)' },
    { label: 'Rejected', color: 'var(--warn)' },
    { label: 'Failed', color: 'var(--danger)' },
    { label: 'Awaiting', color: 'var(--accent)' },
  ];
  return (
    <div className="flex items-center gap-3 text-[11px]">
      {entries.map((e) => (
        <span key={e.label} className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-[2px]"
            style={{ background: e.color }}
          />
          <span className="text-foreground-muted">{e.label}</span>
        </span>
      ))}
    </div>
  );
}

// ── Breakdown ────────────────────────────────────────────────────────

interface BreakdownRow {
  stage: StageKey;
  duration: number; // ms
  percent: number;
  attempts: number;
}

function BreakdownPanel({ rows }: { rows: BreakdownRow[] }) {
  const maxPercent = Math.max(...rows.map((r) => r.percent), 1);
  return (
    <div>
      <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-foreground-subtle">
        Per-stage breakdown
      </div>
      <div className="rounded-md border border-border bg-surface">
        {rows.map((r, i) => (
          <div
            key={r.stage}
            className={`flex items-center gap-4 px-4 py-3 ${
              i < rows.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <div className="flex w-32.5 shrink-0 items-center gap-2.5">
              <StageTag stage={r.stage} />
              <span className="text-[13px] font-medium">
                {STAGE_LIST.find((s) => s.key === r.stage)?.label ?? r.stage}
              </span>
            </div>
            <div className="flex-1">
              <div className="h-2.25 overflow-hidden rounded-[2px] bg-surface-inset">
                <div
                  className="h-full bg-foreground"
                  style={{
                    width: `${(r.percent / maxPercent) * 100}%`,
                    transition: 'width 160ms ease-out',
                  }}
                />
              </div>
            </div>
            <span className="w-18 text-right font-mono text-[12.5px] tabular-nums">
              {formatDuration(r.duration)}
            </span>
            <span className="w-11 text-right font-mono text-[12px] tabular-nums text-foreground-muted">
              {r.percent}%
            </span>
            <span
              className={`w-7.5 text-right font-mono text-[12px] tabular-nums ${
                r.attempts > 1
                  ? 'text-[color:var(--warn)]'
                  : 'text-foreground-subtle'
              }`}
            >
              ×{r.attempts}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Derivation ───────────────────────────────────────────────────────

/**
 * Build timeline segments from the current execution's stage→attempt
 * tree. Each AttemptExecution row becomes one segment; t0/t1 are
 * computed in seconds relative to the execution's startedAt. Stages
 * that never ran produce zero segments and are naturally omitted.
 */
function deriveSegments(detail: TaskDetail): TimelineSegment[] {
  const exec = detail.currentExecution;
  if (!exec) return [];
  const base = new Date(exec.startedAt).getTime();
  const now = Date.now();
  const segments: TimelineSegment[] = [];

  for (const stage of exec.stages) {
    if (!STAGE_KEYS.has(stage.stageName as StageKey)) continue;
    for (const attempt of stage.attempts) {
      const startMs = new Date(attempt.startedAt).getTime();
      const endMs = attempt.endedAt ? new Date(attempt.endedAt).getTime() : now;
      segments.push({
        stage: stage.stageName as StageKey,
        attempt: attempt.attemptNumber,
        status: mapAttemptStatus(attempt.status),
        t0: Math.max(0, (startMs - base) / 1000),
        t1: Math.max(0, (endMs - base) / 1000),
      });
    }
  }
  return segments.sort((a, b) => a.t0 - b.t0);
}

const STAGE_KEYS = new Set<StageKey>([
  'analyze',
  'reproduce',
  'implement',
  'filter',
  'critic',
  'hitl',
  'pr',
]);

function mapAttemptStatus(raw: string): TimelineSegment['status'] {
  const v = raw.toLowerCase();
  if (v === 'completed') return 'done';
  if (v === 'failed') return 'failed';
  if (v === 'awaiting') return 'awaiting';
  if (v === 'running') return 'running';
  return 'done';
}

function wallTime(segments: TimelineSegment[]): number {
  if (segments.length === 0) return 0;
  const last = Math.max(...segments.map((s) => s.t1));
  return last * 1000;
}

function countDone(segments: TimelineSegment[]): number {
  const doneStages = new Set<string>();
  for (const s of segments) {
    if (s.status === 'done') doneStages.add(s.stage);
  }
  return doneStages.size;
}

function countRetries(segments: TimelineSegment[]): number {
  // Retries = sum of (attempt - 1) for each stage, taking max attempt per stage
  const maxByStage = new Map<string, number>();
  for (const s of segments) {
    maxByStage.set(s.stage, Math.max(maxByStage.get(s.stage) ?? 0, s.attempt));
  }
  let retries = 0;
  for (const n of maxByStage.values()) retries += Math.max(0, n - 1);
  return retries;
}

function currentStageRunning(segments: TimelineSegment[]): boolean {
  if (segments.length === 0) return false;
  const last = segments[segments.length - 1];
  return last.status === 'awaiting' || last.status === 'running';
}

function currentStage(
  segments: TimelineSegment[]
): { label: string; subtitle: string; tone: string } | null {
  if (segments.length === 0) return null;
  const last = segments[segments.length - 1];
  return {
    label: last.stage,
    subtitle:
      last.status === 'awaiting'
        ? 'awaiting review'
        : last.status === 'running'
          ? 'in progress'
          : last.status,
    tone:
      last.status === 'awaiting'
        ? 'var(--accent)'
        : last.status === 'running'
          ? 'var(--accent)'
          : 'var(--foreground)',
  };
}

function perStageSummary(
  segments: TimelineSegment[],
  wallMs: number
): BreakdownRow[] {
  const agg = new Map<StageKey, { ms: number; attempts: number }>();
  for (const s of segments) {
    const cur = agg.get(s.stage) ?? { ms: 0, attempts: 0 };
    cur.ms += (s.t1 - s.t0) * 1000;
    cur.attempts = Math.max(cur.attempts, s.attempt);
    agg.set(s.stage, cur);
  }
  const rows: BreakdownRow[] = [];
  for (const s of STAGE_LIST) {
    const v = agg.get(s.key);
    if (!v) continue;
    rows.push({
      stage: s.key,
      duration: v.ms,
      percent: wallMs > 0 ? Math.round((v.ms / wallMs) * 100) : 0,
      attempts: v.attempts,
    });
  }
  return rows;
}

function xAt(t: number, wallSeconds: number): number {
  const t0 = GANTT_LEFT_GUTTER;
  const t1 = 1000;
  const range = t1 - t0;
  return t0 + (t / wallSeconds) * range;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem.toString().padStart(2, '0')}s`;
}

function formatClockFromSeconds(t: number): string {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
