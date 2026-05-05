import type { StageTimingView } from '@/modules/tasks/types';
import {
  GANTT_LEFT_GUTTER,
  GANTT_VIEWBOX_WIDTH,
  STAGE_KEYS,
  STAGE_LIST,
  TICK_CANDIDATES,
  TICK_TARGET,
} from './constants';
import type {
  BreakdownRow,
  CurrentStageInfo,
  StageKey,
  TimelineSegment,
} from './types';

// ── Gantt geometry ──────────────────────────────────────────

/**
 * Map a time offset (seconds since wall start) to an x-coordinate in
 * the Gantt viewBox. Defensive against wallSeconds=0 — the GanttPanel
 * short-circuits the empty case but keep a stable fallback so any
 * consumer that sneaks past the guard never produces NaN.
 */
export function xAt(t: number, wallSeconds: number): number {
  const t0 = GANTT_LEFT_GUTTER;
  const t1 = GANTT_VIEWBOX_WIDTH;
  if (wallSeconds <= 0) return t0;
  return t0 + (t / wallSeconds) * (t1 - t0);
}

/**
 * Pick a tick interval (in seconds) that yields roughly TICK_TARGET
 * ticks across the wall time, snapping to the nearest "nice" duration
 * in TICK_CANDIDATES. Keeps labels from colliding regardless of run
 * length (30 s through several hours).
 */
export function pickTickInterval(wallSeconds: number): number {
  if (wallSeconds <= 0) return 1;
  const raw = wallSeconds / TICK_TARGET;
  for (const c of TICK_CANDIDATES) if (c >= raw) return c;
  return TICK_CANDIDATES[TICK_CANDIDATES.length - 1];
}

// ── Time formatters ─────────────────────────────────────────

/**
 * Human-readable duration. Snaps to the largest reasonable unit so
 * tasks that run for hours don't show "300m" and short tool calls
 * don't show "523.7ms".
 *   < 1 s     →  "523ms"
 *   < 60 s    →  "42s"
 *   < 1 hour  →  "5m 23s"  (drops trailing seconds when zero: "5m")
 *   ≥ 1 hour  →  "1h 12m"  (drops trailing minutes when zero: "1h")
 */
export function formatDuration(ms: number): string {
  const total = Math.round(ms);
  if (total < 1000) return `${total}ms`;
  const totalSeconds = Math.round(total / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

/**
 * Tick label format. Compact units that drop trailing zero parts so
 * the labels stay short and packing density goes up:
 *   exact hour      →  "5h"     (was "5h00m")
 *   exact minute    →  "12m"    (was "12:00")
 *   sub-hour mixed  →  "5h12m"
 *   sub-minute      →  "12:34"
 *   pure seconds    →  "45s"
 */
export function formatClockFromSeconds(t: number): string {
  const total = Math.max(0, Math.round(t));
  if (total === 0) return '0';
  if (total >= 3600) {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  }
  if (total >= 60) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return s > 0
      ? `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}m`;
  }
  return `${total}s`;
}

// ── Segment derivation + aggregation ────────────────────────

/**
 * Build timeline segments from STAGE-kind TaskEvents. t0/t1 are seconds
 * relative to the earliest stage start. Stages keys are normalized to
 * the lowercase StageKey alphabet; unknown keys are dropped.
 */
export function deriveSegments(timings: StageTimingView[]): TimelineSegment[] {
  if (timings.length === 0) return [];
  const baseMs = Math.min(
    ...timings.map((t) => new Date(t.startedAt).getTime())
  );
  const now = Date.now();
  const segments: TimelineSegment[] = [];
  for (const ev of timings) {
    const stage = mapStageKey(ev.stageKey);
    if (!stage || !STAGE_KEYS.has(stage)) continue;
    const startMs = new Date(ev.startedAt).getTime();
    const endMs = ev.endedAt ? new Date(ev.endedAt).getTime() : now;
    segments.push({
      stage,
      attempt: ev.attemptNumber,
      status: mapAttemptStatus(ev.status),
      t0: Math.max(0, (startMs - baseMs) / 1000),
      t1: Math.max(0, (endMs - baseMs) / 1000),
    });
  }
  return segments.sort((a, b) => a.t0 - b.t0);
}

export function mapStageKey(raw: string): StageKey | null {
  switch (raw.toUpperCase()) {
    case 'ANALYSIS':
      return 'analyze';
    case 'REPRODUCE':
      return 'reproduce';
    case 'IMPLEMENT':
      return 'implement';
    case 'FILTER':
      return 'filter';
    case 'CRITIC':
      return 'critic';
    case 'PR':
      return 'pr';
    default:
      return null;
  }
}

export function mapAttemptStatus(raw: string): TimelineSegment['status'] {
  const v = raw.toLowerCase();
  if (v === 'completed') return 'done';
  if (v === 'failed') return 'failed';
  if (v === 'rejected') return 'rejected';
  if (v === 'awaiting') return 'awaiting';
  if (v === 'running') return 'running';
  return 'done';
}

// ── Summary metrics ─────────────────────────────────────────

export function wallTime(segments: TimelineSegment[]): number {
  if (segments.length === 0) return 0;
  return Math.max(...segments.map((s) => s.t1)) * 1000;
}

export function countDone(segments: TimelineSegment[]): number {
  const doneStages = new Set<string>();
  for (const s of segments) {
    if (s.status === 'done') doneStages.add(s.stage);
  }
  return doneStages.size;
}

/** Sum of (max attempt − 1) per stage. */
export function countRetries(segments: TimelineSegment[]): number {
  const maxByStage = new Map<string, number>();
  for (const s of segments) {
    maxByStage.set(s.stage, Math.max(maxByStage.get(s.stage) ?? 0, s.attempt));
  }
  let retries = 0;
  for (const n of maxByStage.values()) retries += Math.max(0, n - 1);
  return retries;
}

export function currentStageRunning(segments: TimelineSegment[]): boolean {
  if (segments.length === 0) return false;
  const last = segments[segments.length - 1];
  return last.status === 'awaiting' || last.status === 'running';
}

export function currentStage(
  segments: TimelineSegment[]
): CurrentStageInfo | null {
  if (segments.length === 0) return null;
  const last = segments[segments.length - 1];
  const meta = STAGE_LIST.find((s) => s.key === last.stage);
  return {
    label: meta?.label ?? last.stage,
    subtitle:
      last.status === 'awaiting'
        ? 'awaiting review'
        : last.status === 'running'
          ? 'in progress'
          : last.status,
    tone:
      last.status === 'awaiting' || last.status === 'running'
        ? 'var(--accent)'
        : 'var(--foreground)',
  };
}

export function perStageSummary(
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
