import { useQuery } from '@apollo/client';
import { GET_PROJECTS } from './graphql';
import type { ApiProject } from './types';

export function useService() {
  const { data, loading } = useQuery(GET_PROJECTS);
  const projects: ApiProject[] = data?.projects ?? [];
  return { loading, projects };
}
