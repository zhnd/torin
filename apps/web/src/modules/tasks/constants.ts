import type { FilterEntry } from './types';

export const TASK_FILTERS: FilterEntry[] = [
  { key: 'all', label: 'All' },
  { key: 'AWAITING_REVIEW', label: 'Awaiting' },
  { key: 'RUNNING', label: 'Running' },
  { key: 'PENDING', label: 'Queued' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'FAILED', label: 'Failed' },
] as const;

export const TASKS_POLL_INTERVAL_MS = 5000;
