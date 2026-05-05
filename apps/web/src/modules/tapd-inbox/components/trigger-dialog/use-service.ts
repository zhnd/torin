'use client';

import { useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { RESOLVE_DEFECT } from '@/modules/tasks/graphql';
import { PROJECT_BRANCHES_QUERY } from '../../graphql';
import type {
  ProjectBranchesData,
  TapdBugRow,
  TapdInboxMapping,
} from '../../types';

interface Args {
  bug: TapdBugRow | null;
  mapping: TapdInboxMapping | null;
  onClose: () => void;
}

export function useService({ bug, mapping, onClose }: Args) {
  const router = useRouter();
  const projectId = mapping?.projectId ?? null;

  const { data: branchesData, loading: branchesLoading } =
    useQuery<ProjectBranchesData>(PROJECT_BRANCHES_QUERY, {
      variables: { projectId: projectId as string },
      skip: !projectId || !bug,
      fetchPolicy: 'network-only',
    });
  const branches = branchesData?.projectBranches ?? [];

  const defaultDescription = useMemo(() => {
    if (!bug) return '';
    const head = bug.title.trim();
    const body = bug.description.trim();
    const link = `\n\nSource: ${bug.url}`;
    return body ? `${head}\n\n${body}${link}` : `${head}${link}`;
  }, [bug]);

  const [description, setDescription] = useState('');
  const [baseBranch, setBaseBranch] = useState<string>('');

  // Hydrate when a new bug is opened (or when branches finish loading).
  useEffect(() => {
    if (!bug) return;
    setDescription(defaultDescription);
  }, [bug, defaultDescription]);

  useEffect(() => {
    if (!bug) return;
    if (branches.length === 0) return;
    setBaseBranch((current) =>
      current && branches.includes(current) ? current : branches[0]
    );
  }, [bug, branches]);

  const [resolveDefect, { loading: submitting }] = useMutation(RESOLVE_DEFECT);

  async function submit() {
    if (!bug) return;
    if (!projectId) {
      toast.error('No project mapped for this Tapd workspace');
      return;
    }
    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }
    try {
      const { data } = await resolveDefect({
        variables: {
          projectId,
          defectDescription: description.trim(),
          baseBranch: baseBranch || undefined,
          tapdBugId: bug.id,
          tapdWorkspaceId: bug.workspaceId,
        },
      });
      const taskId = data?.resolveDefect?.id;
      if (taskId) {
        toast.success('Defect resolution started');
        onClose();
        router.push(`/tasks/${taskId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Trigger failed');
    }
  }

  return {
    projectId,
    project: mapping?.project ?? null,
    branches,
    branchesLoading,
    description,
    setDescription,
    baseBranch,
    setBaseBranch,
    submit,
    submitting,
  };
}
