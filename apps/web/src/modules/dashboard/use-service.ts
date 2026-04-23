'use client';

import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { DASHBOARD_QUERY } from './graphql';
import {
  buildActivityRows,
  buildAwaitingRows,
  summarize,
} from './libs';
import type { DashboardProject, DashboardTask } from './types';

/**
 * Dashboard data layer. Pulls projects + tasks via Apollo, then derives
 * the four metric values, the awaiting-review table rows, and the
 * recent-activity feed in pure helpers (`./libs`).
 *
 * `now` is captured once per render to keep relative-time strings
 * deterministic across child renders within the same tick.
 */
export function useService() {
  const { data, loading } = useQuery(DASHBOARD_QUERY);

  const projects: DashboardProject[] = data?.projects ?? [];
  const tasks: DashboardTask[] = data?.tasks ?? [];

  const now = useMemo(() => Date.now(), [data]);

  const summary = useMemo(() => summarize(tasks, now), [tasks, now]);
  const awaitingRows = useMemo(
    () => buildAwaitingRows(tasks, now),
    [tasks, now]
  );
  const activityRows = useMemo(() => buildActivityRows(tasks), [tasks]);

  return {
    loading,
    projects,
    summary,
    awaitingRows,
    activityRows,
  };
}
