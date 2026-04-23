import type { WorkflowDefinitionSpec } from '../types';

export const RESOLVE_DEFECT_DEFINITION: WorkflowDefinitionSpec = {
  kind: 'resolve-defect',
  displayName: 'Defect resolution',
  version: 1,
  stages: [
    {
      name: 'analyze',
      label: 'Analysis',
      order: 1,
      allowsRetry: true,
      allowsHitl: true,
    },
    {
      name: 'reproduce',
      label: 'Reproduction',
      order: 2,
      allowsRetry: true,
      allowsHitl: false,
    },
    {
      name: 'implement',
      label: 'Implementation',
      order: 3,
      allowsRetry: true,
      allowsHitl: false,
      config: { samples: 3 },
    },
    {
      name: 'filter',
      label: 'Filter',
      order: 4,
      allowsRetry: false,
      allowsHitl: false,
    },
    {
      name: 'critic',
      label: 'Critic review',
      order: 5,
      allowsRetry: false,
      allowsHitl: false,
    },
    {
      name: 'hitl',
      label: 'Human review',
      order: 6,
      allowsRetry: true,
      allowsHitl: true,
    },
    {
      name: 'pr',
      label: 'Pull request',
      order: 7,
      allowsRetry: false,
      allowsHitl: false,
    },
  ],
};
