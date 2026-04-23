export interface WorkflowStageMeta {
  id: string;
  name: string;
  label: string;
  order: number;
  allowsRetry: boolean;
  allowsHitl: boolean;
}

export interface WorkflowDefinitionMeta {
  id: string;
  kind: string;
  displayName: string;
  version: number;
  stages: WorkflowStageMeta[];
}

export interface SelectOption {
  value: string;
  label: string;
}
