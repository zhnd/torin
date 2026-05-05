import type { ActivityLogEntry } from '@/modules/tasks/types';

export const CATEGORY_LABEL: Record<ActivityLogEntry['category'], string> = {
  stage: 'STAGE',
  agent: 'AGENT',
  tool: 'TOOL',
};

export const CATEGORY_TONE: Record<ActivityLogEntry['category'], string> = {
  stage: 'var(--foreground)',
  agent: 'var(--accent)',
  tool: 'var(--foreground-muted)',
};
