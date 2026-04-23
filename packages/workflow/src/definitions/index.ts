export type {
  WorkflowDefinitionSpec,
  WorkflowStageSpec,
} from './types';
export { ANALYZE_REPOSITORY_DEFINITION } from './analyze-repository/stages';
export { RESOLVE_DEFECT_DEFINITION } from './resolve-defect/stages';

import { ANALYZE_REPOSITORY_DEFINITION } from './analyze-repository/stages';
import { RESOLVE_DEFECT_DEFINITION } from './resolve-defect/stages';
import type { WorkflowDefinitionSpec } from './types';

/**
 * All workflow definitions known to the system. Consumed by the server
 * seed at boot + by the GraphQL metadata resolvers.
 */
export const WORKFLOW_DEFINITIONS: WorkflowDefinitionSpec[] = [
  RESOLVE_DEFECT_DEFINITION,
  ANALYZE_REPOSITORY_DEFINITION,
];
