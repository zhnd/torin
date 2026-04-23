'use client';

import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { TASKS_POLL_INTERVAL_MS } from './constants';
import { GET_TASKS } from './graphql';
import { countByStatus, filterTasks } from './libs';
import type { TaskListRow, TaskListStatusFilter } from './types';

/**
 * Tasks-list data layer. Pulls all tasks (poll), exposes the active
 * status filter, derived counts, filtered rows, and a router-aware
 * `openTask` callback.
 */
export function useService() {
  const router = useRouter();
  const { data, loading } = useQuery(GET_TASKS, {
    pollInterval: TASKS_POLL_INTERVAL_MS,
  });
  const [status, setStatus] = useState<TaskListStatusFilter>('all');

  const all: TaskListRow[] = data?.tasks ?? [];

  const counts = useMemo(() => countByStatus(all), [all]);
  const rows = useMemo(() => filterTasks(all, status), [all, status]);

  const openTask = useCallback(
    (id: string) => router.push(`/tasks/${id}`),
    [router]
  );

  return {
    loading,
    status,
    setStatus,
    all,
    counts,
    rows,
    openTask,
  };
}
