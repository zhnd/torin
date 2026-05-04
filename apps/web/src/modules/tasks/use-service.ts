'use client';

import { useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';
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
  const { data, loading } = useQuery(GET_TASKS, {
    pollInterval: TASKS_POLL_INTERVAL_MS,
  });
  const [status, setStatus] = useState<TaskListStatusFilter>(() => {
    if (typeof window === 'undefined') return 'all';
    const initialStatus = new URLSearchParams(window.location.search).get(
      'status'
    );
    return initialStatus &&
      ['AWAITING_REVIEW', 'RUNNING', 'PENDING', 'COMPLETED', 'FAILED'].includes(
        initialStatus
      )
      ? (initialStatus as TaskListStatusFilter)
      : 'all';
  });
  const [query, setQuery] = useState('');

  const all: TaskListRow[] = data?.tasks ?? [];

  const counts = useMemo(() => countByStatus(all), [all]);
  const rows = useMemo(
    () => filterTasks(all, status, query),
    [all, status, query]
  );

  return {
    loading,
    status,
    setStatus,
    query,
    setQuery,
    all,
    counts,
    rows,
  };
}
