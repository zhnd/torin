/** Map TaskStatus → human-readable event verb for the activity feed. */
export const STATUS_EVENT = {
  PENDING: 'queued',
  RUNNING: 'stage started',
  AWAITING_REVIEW: 'awaiting human review',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

/** Window for "this week" metric computations. */
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Cap on the recent-activity feed. */
export const ACTIVITY_LIMIT = 10;
