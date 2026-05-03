import type { AwaitingReviewRow } from './components/awaiting-review-table';
import type { ActivityRow } from './components/recent-activity';
import { ACTIVITY_LIMIT, SEVEN_DAYS_MS, STATUS_EVENT } from './constants';
import type { DashboardTask } from './types';

/** Derive a display title from a Task row. */
export function deriveTitle(task: DashboardTask): string {
  if (task.type === 'RESOLVE_DEFECT') {
    return `Defect resolution · ${task.id.slice(-4)}`;
  }
  return `${task.type.toLowerCase().replace(/_/g, ' ')} · ${task.id.slice(-4)}`;
}

/** Format an ISO timestamp as a relative-to-now string (e.g., "5m ago"). */
export function formatRelative(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** HH:MM:SS clock-style formatter used in the activity feed. */
export function formatClock(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Build the awaiting-review table rows. A task is "awaiting review" when
 * its `awaiting` field is non-null (server-derived from any STAGE event
 * in AWAITING status). Sorted oldest-first so stale reviews bubble up.
 */
export function buildAwaitingRows(
  tasks: DashboardTask[],
  now: number
): AwaitingReviewRow[] {
  return tasks
    .filter((t) => t.awaiting != null)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    )
    .map((t) => ({
      id: t.id,
      title: deriveTitle(t),
      projectName: t.project?.name ?? '—',
      stage: t.awaiting?.stageKey?.toLowerCase() ?? 'hitl',
      risk: 'medium',
      waited: formatRelative(t.updatedAt, now),
      branch: `torin/${t.id.slice(-8)}`,
    }));
}

/** Top-N most recently updated tasks, mapped to activity rows. */
export function buildActivityRows(tasks: DashboardTask[]): ActivityRow[] {
  return tasks
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, ACTIVITY_LIMIT)
    .map((t) => ({
      time: formatClock(t.updatedAt),
      taskId: t.id,
      projectName: t.project?.name ?? '—',
      stage: t.currentStageKey?.toLowerCase() ?? 'analyze',
      event:
        STATUS_EVENT[t.status as keyof typeof STATUS_EVENT] ??
        t.status.toLowerCase(),
    }));
}

/**
 * Aggregate dashboard summary numbers in one pass.
 * Pure: takes tasks + a `now` clock so callers can be deterministic.
 */
export function summarize(tasks: DashboardTask[], now: number) {
  const awaiting = tasks.filter((t) => t.awaiting != null);
  const active = tasks.filter(
    (t) => t.status === 'RUNNING' || t.status === 'PENDING'
  );
  const completed = tasks.filter((t) => t.status === 'COMPLETED');
  const failed = tasks.filter((t) => t.status === 'FAILED');

  const sevenDaysAgo = now - SEVEN_DAYS_MS;
  const recentTasks = tasks.filter(
    (t) => new Date(t.updatedAt).getTime() >= sevenDaysAgo
  );
  const recentOutcomes = recentTasks.filter(
    (t) => t.status === 'COMPLETED' || t.status === 'FAILED'
  );
  const successRate =
    recentOutcomes.length > 0
      ? Math.round(
          (recentOutcomes.filter((t) => t.status === 'COMPLETED').length /
            recentOutcomes.length) *
            100
        )
      : null;

  const runningCount = active.filter((t) => t.status === 'RUNNING').length;
  const queuedCount = active.filter((t) => t.status === 'PENDING').length;

  return {
    awaitingCount: awaiting.length,
    activeCount: active.length,
    runningCount,
    queuedCount,
    completedCount: completed.length,
    failedCount: failed.length,
    // Cost rollup deferred to the agent_log work; tasks no longer carry
    // cost aggregates on the row.
    weeklyCost: 0,
    recentTaskCount: recentTasks.length,
    recentOutcomeCount: recentOutcomes.length,
    successRate,
  };
}
