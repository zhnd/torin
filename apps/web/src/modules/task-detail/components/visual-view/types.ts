import type { StageTimingView } from '@/modules/tasks/types';

export type StageKey =
  | 'analyze'
  | 'reproduce'
  | 'implement'
  | 'filter'
  | 'critic'
  | 'pr';

export interface StageMeta {
  key: StageKey;
  label: string;
}

export interface TimelineSegment {
  stage: StageKey;
  attempt: number;
  status: 'done' | 'rejected' | 'failed' | 'awaiting' | 'running';
  /** Seconds from the earliest stage start. */
  t0: number;
  /** Seconds from the earliest stage start. */
  t1: number;
  label?: string;
}

export interface BreakdownRow {
  stage: StageKey;
  /** Sum of attempt durations in milliseconds. */
  duration: number;
  /** Stage duration as a percent of wall time (0–100, integer). */
  percent: number;
  /** Number of attempts the stage ran. */
  attempts: number;
}

export interface CurrentStageInfo {
  label: string;
  subtitle: string;
  tone: string;
}

export interface VisualViewProps {
  stageTimings: StageTimingView[];
}
