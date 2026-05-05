import { StageTag } from '@/components/common/stage-tag';
import {
  GANTT_LEFT_GUTTER,
  GANTT_ROW_HEIGHT,
  GANTT_SEGMENT_HEIGHT,
  GANTT_TOP_PAD,
  GANTT_VIEWBOX_WIDTH,
  STAGE_LIST,
  STATUS_COLOR,
} from './constants';
import {
  countDone,
  countRetries,
  currentStage,
  currentStageRunning,
  deriveSegments,
  formatClockFromSeconds,
  formatDuration,
  perStageSummary,
  pickTickInterval,
  wallTime,
  xAt,
} from './libs';
import type { BreakdownRow, TimelineSegment, VisualViewProps } from './types';

/**
 * Visual tab body — 4 metric cards + pipeline Gantt + per-stage
 * breakdown bars. Sourced from `task.events` (STAGE-kind), so it tracks
 * any stage that ran — including ones without agent invocations
 * (FILTER, PR). Empty-state short-circuits the SVG to avoid the
 * divide-by-zero misalignment when there is no data yet.
 */
export function VisualView({ stageTimings }: VisualViewProps) {
  const segments = deriveSegments(stageTimings);
  const wallMs = wallTime(segments);
  const stagesDone = countDone(segments);
  const stagesSkipped = Math.max(
    0,
    STAGE_LIST.length - stagesDone - (currentStageRunning(segments) ? 1 : 0)
  );
  const retries = countRetries(segments);
  const current = currentStage(segments);
  const perStage = perStageSummary(segments, wallMs);

  return (
    <div className="flex flex-col gap-5 pb-12">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricBlock
          label="Wall time"
          value={formatDuration(wallMs)}
          emphasize
        />
        <MetricBlock
          label="Stages"
          value={`${stagesDone} / ${STAGE_LIST.length}`}
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

      <GanttPanel segments={segments} wallSeconds={Math.ceil(wallMs / 1000)} />

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
        className="mt-2.5 font-mono font-bold leading-none tabular-nums tracking-normal"
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

function GanttPanel({
  segments,
  wallSeconds,
}: {
  segments: TimelineSegment[];
  wallSeconds: number;
}) {
  if (segments.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="text-[13px] font-semibold">Pipeline timeline</span>
          <span className="flex-1" />
          <Legend />
        </div>
        <div className="px-6 py-12 text-center text-[12.5px] text-foreground-muted">
          No timeline segments recorded yet.
        </div>
      </div>
    );
  }

  const height = GANTT_TOP_PAD + STAGE_LIST.length * GANTT_ROW_HEIGHT + 12;

  // Pick a tick interval that yields roughly TICK_TARGET ticks across
  // the wall time, snapping to the nearest "nice" duration. We
  // deliberately do NOT append an extra tick at exactly wallSeconds —
  // the "Wall time" metric card above shows the precise end value, and
  // the chart's right edge always renders at wallSeconds regardless of
  // tick placement.
  const tickInterval = pickTickInterval(wallSeconds);
  const ticks: number[] = [];
  for (let t = 0; t <= wallSeconds; t += tickInterval) ticks.push(t);

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
          viewBox={`0 0 ${GANTT_VIEWBOX_WIDTH} ${height}`}
          width="100%"
          height={height}
          style={{ display: 'block' }}
          role="img"
          aria-hidden="true"
        >
          {/* Tick marks. First/last labels use start/end anchors so they
              don't bleed back into the row-label gutter. */}
          {ticks.map((t, idx) => {
            const x = xAt(t, wallSeconds);
            const anchor =
              idx === 0 ? 'start' : idx === ticks.length - 1 ? 'end' : 'middle';
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
                  textAnchor={anchor}
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
                <text
                  x={0}
                  y={y + GANTT_SEGMENT_HEIGHT / 2 + 4}
                  fill="var(--foreground)"
                  fontFamily="var(--font-sans)"
                  fontSize="11.5"
                >
                  {s.label}
                </text>
                <line
                  x1={GANTT_LEFT_GUTTER}
                  x2={GANTT_VIEWBOX_WIDTH}
                  y1={y + GANTT_SEGMENT_HEIGHT / 2}
                  y2={y + GANTT_SEGMENT_HEIGHT / 2}
                  stroke="var(--border)"
                  opacity={0.5}
                />
                {segments
                  .filter((seg) => seg.stage === s.key)
                  .map((seg, j) => (
                    <Segment
                      // biome-ignore lint/suspicious/noArrayIndexKey: segments are positionally stable per render
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

function BreakdownPanel({ rows }: { rows: BreakdownRow[] }) {
  if (rows.length === 0) {
    return (
      <div>
        <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-foreground-subtle">
          Per-stage breakdown
        </div>
        <div className="rounded-md border border-border bg-surface px-4 py-8 text-center text-[12px] text-foreground-muted">
          No stage durations recorded yet.
        </div>
      </div>
    );
  }
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
            <div className="flex w-37.5 shrink-0 items-center gap-2.5">
              <StageTag stage={r.stage} />
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
