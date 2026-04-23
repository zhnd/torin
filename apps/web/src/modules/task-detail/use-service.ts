'use client';

import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { GET_TASK, REVIEW_TASK, TASK_UPDATED } from '@/modules/tasks/graphql';
import { transformTaskToDetail } from '@/modules/tasks/transform';
import {
  computeHitlWaited,
  computeStageTimings,
  normalizeStageStatus,
  pickInitialStage,
} from './libs';
import type { DetailTab, StageKey, StageStatusMap } from './types';

interface UseServiceInput {
  taskId: string;
}

/**
 * Task detail data layer. Opens a live subscription (taskUpdated) on
 * mount — subscription pushes write straight into the Apollo cache so
 * every consumer of GET_TASK picks up changes automatically. No polling.
 *
 * Also derives stage status map, initial-focus stage, per-stage
 * timings, and exposes the HITL review mutation.
 */
export function useService({ taskId }: UseServiceInput) {
  const { data, loading, refetch, client } = useQuery(GET_TASK, {
    variables: { id: taskId },
  });

  useSubscription(TASK_UPDATED, {
    variables: { id: taskId },
    onData: ({ data: sub }) => {
      const incoming = sub?.data?.taskUpdated;
      if (!incoming) return;
      client.writeQuery({
        query: GET_TASK,
        variables: { id: taskId },
        data: { task: incoming },
      });
    },
  });

  const task = data?.task;
  const detail = useMemo(
    () => (task ? transformTaskToDetail(task) : null),
    [task]
  );
  const result = (task?.result ?? {}) as Record<string, unknown>;

  const stages = useMemo<StageStatusMap>(() => {
    // Prefer StageExecution rows on the current execution; fall back
    // to legacy Task.stages JSON during the transition window.
    const byName: Record<string, string> = {};
    const current = detail?.currentExecution;
    if (current) {
      for (const s of current.stages) byName[s.stageName] = s.status;
    } else {
      const raw = (result.stages ?? {}) as Record<string, string>;
      Object.assign(byName, raw);
    }
    return {
      analyze: normalizeStageStatus(byName.analyze ?? byName.analysis),
      reproduce: normalizeStageStatus(byName.reproduce),
      implement: normalizeStageStatus(byName.implement),
      filter: normalizeStageStatus(byName.filter),
      critic: normalizeStageStatus(byName.critic),
      hitl: normalizeStageStatus(byName.hitl),
      pr: normalizeStageStatus(byName.pr),
    };
  }, [detail, result]);

  const initialStage = detail
    ? pickInitialStage(detail.task.status, stages)
    : 'analyze';
  const [selectedStage, setSelectedStage] = useState<StageKey>(initialStage);
  const [tab, setTab] = useState<DetailTab>('overview');

  const timings = useMemo(
    () => (detail ? computeStageTimings(detail.timeline) : {}),
    [detail]
  );
  const hitlWaited = useMemo(
    () =>
      detail
        ? computeHitlWaited(detail.timeline, stages.hitl === 'awaiting')
        : null,
    [detail, stages.hitl]
  );

  const [reviewTask, { loading: reviewing }] = useMutation(REVIEW_TASK);

  const submitReview = useCallback(
    async (lane: string, feedback: string) => {
      const action = lane === 'approve' ? 'approve' : 'reject';
      try {
        await reviewTask({
          variables: { taskId, action, feedback: feedback || null },
        });
        toast.success(
          lane === 'approve' ? 'Approved — opening PR' : 'Feedback sent'
        );
        await refetch();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Review failed');
      }
    },
    [reviewTask, refetch, taskId]
  );

  return {
    loading,
    detail,
    result,
    stages,
    selectedStage,
    setSelectedStage,
    tab,
    setTab,
    timings,
    hitlWaited,
    submitReview,
    reviewing,
  };
}
