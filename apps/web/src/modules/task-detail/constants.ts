import type { DetailTab, StageKey } from './types';

export const STAGE_LABELS: Record<StageKey, string> = {
  analyze: 'Analysis',
  reproduce: 'Reproduction',
  implement: 'Implementation',
  filter: 'Filter',
  critic: 'Critic review',
  hitl: 'Human review',
  pr: 'Pull request',
} as const;

export const STAGE_ORDER: StageKey[] = [
  'analyze',
  'reproduce',
  'implement',
  'filter',
  'critic',
  'hitl',
  'pr',
];

export const DETAIL_TABS: [DetailTab, string][] = [
  ['overview', 'Overview'],
  ['visual', 'Visual'],
  ['events', 'Events'],
  ['trace', 'Trace'],
];
