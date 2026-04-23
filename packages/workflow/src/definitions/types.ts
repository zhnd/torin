/**
 * Shape of a workflow definition as authored in TS. These are seeded
 * into the WorkflowDefinition / WorkflowStage tables at server boot so
 * UI + validation logic can treat workflow metadata as data.
 *
 * Adding a new workflow: drop a new folder under `definitions/<kind>/`
 * that exports a WorkflowDefinitionSpec, and register it in
 * `definitions/index.ts`. No schema migration.
 */

export interface WorkflowStageSpec {
  name: string;
  label: string;
  order: number;
  allowsRetry?: boolean;
  allowsHitl?: boolean;
  config?: Record<string, unknown>;
}

export interface WorkflowDefinitionSpec {
  kind: string;
  displayName: string;
  /**
   * Bumped whenever `stages` changes. Older WorkflowExecution rows keep
   * rendering with the version they started under.
   */
  version: number;
  stages: WorkflowStageSpec[];
}
