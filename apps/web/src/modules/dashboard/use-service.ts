'use client';

import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { DASHBOARD_QUERY } from './graphql';
import {
  buildActivityRows,
  buildAwaitingRows,
  buildProjectActivity,
  buildStageDistribution,
  summarize,
} from './libs';
import type { DashboardProject, DashboardTask } from './types';

/**
 * Dashboard data layer. Pulls projects + tasks via Apollo, then derives
 * the four metric values, the awaiting-review table rows, the recent-
 * activity feed, the stage distribution, and the project activity panel
 * in pure helpers (`./libs`).
 */
export function useService() {
  // 5s polling matches the "live · auto-refresh" hero copy. Cheap at
  // current scale (per-user task counts are small); revisit if the
  // dashboard ever loads thousands of rows.
  const { data, loading } = useQuery(DASHBOARD_QUERY, {
    pollInterval: 5_000,
  });

  const projects: DashboardProject[] = data?.projects ?? [];
  const tasks: DashboardTask[] = data?.tasks ?? [];

  // biome-ignore lint/correctness/useExhaustiveDependencies: bumping `now` per data refresh is intentional — relative timestamps need to advance when data does
  const now = useMemo(() => Date.now(), [data]);

  const summary = useMemo(() => summarize(tasks, now), [tasks, now]);
  const awaitingRows = useMemo(
    () => buildAwaitingRows(tasks, now),
    [tasks, now]
  );
  const activityRows = useMemo(() => buildActivityRows(tasks), [tasks]);
  const stageDistribution = useMemo(
    () => buildStageDistribution(tasks),
    [tasks]
  );
  const projectActivity = useMemo(() => buildProjectActivity(tasks), [tasks]);

  return {
    loading,
    projects,
    summary,
    awaitingRows,
    activityRows,
    stageDistribution,
    projectActivity,
  };
}
