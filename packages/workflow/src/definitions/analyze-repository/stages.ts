import type { WorkflowDefinitionSpec } from '../types';

export const ANALYZE_REPOSITORY_DEFINITION: WorkflowDefinitionSpec = {
  kind: 'analyze-repository',
  displayName: 'Repository analysis',
  version: 1,
  stages: [
    {
      name: 'clone',
      label: 'Clone',
      order: 1,
      allowsRetry: true,
      allowsHitl: false,
    },
    {
      name: 'analyze',
      label: 'Analysis',
      order: 2,
      allowsRetry: true,
      allowsHitl: false,
    },
    {
      name: 'summarize',
      label: 'Summary',
      order: 3,
      allowsRetry: false,
      allowsHitl: false,
    },
  ],
};
