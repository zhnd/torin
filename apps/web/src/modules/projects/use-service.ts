import { useQuery } from '@apollo/client/react';
import { GET_PROJECTS } from './graphql';
import type { ApiProject } from './types';

export function useService() {
  const { data, loading } = useQuery<{ projects: ApiProject[] }>(GET_PROJECTS);
  const projects: ApiProject[] = data?.projects ?? [];
  return { loading, projects };
}
