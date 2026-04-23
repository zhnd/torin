import { useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ANALYZE_REPOSITORY,
  DELETE_PROJECT,
  GET_PROJECT,
} from '@/modules/projects/graphql';
import { RESOLVE_DEFECT } from '@/modules/tasks/graphql';
import { pickRecentTasks, sortTasksRecent } from './libs';
import type { DetailTab, ProjectDetailData } from './types';

interface UseServiceInput {
  projectId: string;
}

export function useService({ projectId }: UseServiceInput) {
  const router = useRouter();
  const { data, loading, error } = useQuery(GET_PROJECT, {
    variables: { id: projectId },
  });
  const project: ProjectDetailData | null = data?.project ?? null;

  const [tab, setTab] = useState<DetailTab>('overview');
  const [resolveDefectOpen, setResolveDefectOpen] = useState(false);
  const [defectDescription, setDefectDescription] = useState('');

  const [resolveDefect, { loading: resolving }] = useMutation(RESOLVE_DEFECT);
  const [analyzeRepository, { loading: analyzing }] =
    useMutation(ANALYZE_REPOSITORY);
  const [deleteProject, { loading: deleting }] = useMutation(DELETE_PROJECT);

  const recentTasks = useMemo(
    () => (project ? pickRecentTasks(project.tasks) : []),
    [project]
  );
  const sortedTasks = useMemo(
    () => (project ? sortTasksRecent(project.tasks) : []),
    [project]
  );

  async function submitDefect() {
    if (!defectDescription.trim()) return;
    try {
      const { data: mutData } = await resolveDefect({
        variables: { projectId, defectDescription },
      });
      if (mutData?.resolveDefect?.id) {
        toast.success('Defect resolution started');
        setResolveDefectOpen(false);
        setDefectDescription('');
        router.push(`/tasks/${mutData.resolveDefect.id}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to start defect resolution'
      );
    }
  }

  async function runAnalysis() {
    try {
      const { data: mutData } = await analyzeRepository({
        variables: { projectId },
      });
      if (mutData?.analyzeRepository?.id) {
        toast.success('Analysis started');
        router.push(`/tasks/${mutData.analyzeRepository.id}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to start analysis'
      );
    }
  }

  async function removeProject() {
    try {
      await deleteProject({ variables: { id: projectId } });
      toast.success('Project deleted');
      router.push('/projects');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete project'
      );
    }
  }

  return {
    loading,
    error,
    project,
    tab,
    setTab,
    resolveDefectOpen,
    setResolveDefectOpen,
    defectDescription,
    setDefectDescription,
    resolving,
    analyzing,
    deleting,
    recentTasks,
    sortedTasks,
    submitDefect,
    runAnalysis,
    removeProject,
  };
}
