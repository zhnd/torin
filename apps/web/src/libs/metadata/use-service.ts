import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { GET_METADATA } from './graphql';
import type {
  SelectOption,
  WorkflowDefinitionMeta,
  WorkflowStageMeta,
} from './types';

interface MetadataShape {
  workflowDefinitions: WorkflowDefinitionMeta[];
  taskStatusOptions: SelectOption[];
  taskTypeOptions: SelectOption[];
}

export function useMetadata(): MetadataShape {
  const { data } = useQuery(GET_METADATA, {
    fetchPolicy: 'cache-first',
  });
  return {
    workflowDefinitions: data?.workflowDefinitions ?? [],
    taskStatusOptions: data?.taskStatusOptions ?? [],
    taskTypeOptions: data?.taskTypeOptions ?? [],
  };
}

export function useWorkflowDefinition(
  kind: string
): WorkflowDefinitionMeta | null {
  const { workflowDefinitions } = useMetadata();
  return (
    workflowDefinitions.find((w) => w.kind === kind) ?? null
  );
}

export function useStageMetadata(kind: string): {
  stages: WorkflowStageMeta[];
  labelFor: (name: string) => string;
  orderFor: (name: string) => number;
} {
  const def = useWorkflowDefinition(kind);
  return useMemo(() => {
    const stages = def?.stages ?? [];
    const byName = new Map(stages.map((s) => [s.name, s]));
    return {
      stages,
      labelFor: (name) => byName.get(name)?.label ?? humanize(name),
      orderFor: (name) => byName.get(name)?.order ?? 0,
    };
  }, [def]);
}

function humanize(name: string): string {
  return name
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
