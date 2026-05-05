import type { StageItem } from './types';

export const DEFAULT_STAGES: StageItem[] = [
  { key: 'analyze', label: 'Analyze' },
  { key: 'reproduce', label: 'Reproduce' },
  { key: 'implement', label: 'Implement' },
  { key: 'filter', label: 'Filter' },
  { key: 'critic', label: 'Critic' },
  { key: 'hitl', label: 'HITL-final' },
  { key: 'pr', label: 'Pull request' },
];
