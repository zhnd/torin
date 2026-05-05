export type StageStatus =
  | 'pending'
  | 'running'
  | 'awaiting'
  | 'done'
  | 'auto'
  | 'failed'
  | 'skipped';

export interface StageItem {
  key: string;
  label: string;
}

export interface StageTrackProps {
  stages: Partial<Record<string, StageStatus>>;
  currentStage?: string;
  onSelect?: (key: string) => void;
  list?: StageItem[];
  timings?: Partial<Record<string, string>>;
}
