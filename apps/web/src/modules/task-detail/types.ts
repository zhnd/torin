import type { StageStatus } from '@/components/common/stage-track';
export type { TaskDetail, TimelineEvent } from '@/modules/tasks/types';

export type StageKey =
  | 'analyze'
  | 'reproduce'
  | 'implement'
  | 'filter'
  | 'critic'
  | 'hitl'
  | 'pr';

export type DetailTab =
  | 'overview'
  | 'visual'
  | 'events'
  | 'trace'
  | 'retrospective';

export type StageStatusMap = Record<StageKey, StageStatus>;
