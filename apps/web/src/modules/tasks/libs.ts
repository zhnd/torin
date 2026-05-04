import { TASK_FILTERS } from './constants';
import type { TaskListRow, TaskListStatusFilter } from './types';

/** Tally tasks by status filter, including the implicit `all` bucket. */
export function countByStatus(
  tasks: TaskListRow[]
): Record<TaskListStatusFilter, number> {
  return TASK_FILTERS.reduce<Record<TaskListStatusFilter, number>>(
    (acc, f) => {
      acc[f.key] =
        f.key === 'all'
          ? tasks.length
          : tasks.filter((t) => t.status === f.key).length;
      return acc;
    },
    {
      all: 0,
      AWAITING_REVIEW: 0,
      RUNNING: 0,
      PENDING: 0,
      COMPLETED: 0,
      FAILED: 0,
    }
  );
}

export function filterTasks(
  tasks: TaskListRow[],
  status: TaskListStatusFilter,
  query = ''
): TaskListRow[] {
  const normalized = query.trim().toLowerCase();
  const byStatus =
    status === 'all' ? tasks : tasks.filter((t) => t.status === status);
  if (!normalized) return byStatus;

  return byStatus.filter((t) => {
    const haystack = [t.id, t.type, t.status, t.currentStage, t.project?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function formatCost(usd: number | null): string {
  return usd != null ? `$${usd.toFixed(2)}` : '—';
}

export function humanizeTaskType(type: string): string {
  return type.toLowerCase().replace(/_/g, ' ');
}
