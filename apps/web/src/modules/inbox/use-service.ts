'use client';

import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { INBOX_QUERY } from './graphql';
import { buildAwaitingItems, buildDecisions, summarizeInbox } from './libs';
import type { InboxTask } from './types';

const INBOX_POLL_INTERVAL_MS = 5000;

/**
 * Inbox data layer. Pulls all tasks (poll), derives the awaiting queue,
 * the recent-decisions feed, and the three inbox summary numbers.
 */
export function useService() {
  const { data, loading } = useQuery(INBOX_QUERY, {
    pollInterval: INBOX_POLL_INTERVAL_MS,
  });

  const tasks: InboxTask[] = data?.tasks ?? [];

  // biome-ignore lint/correctness/useExhaustiveDependencies: bumping `now` per data refresh is intentional — relative timestamps need to advance when data does
  const now = useMemo(() => Date.now(), [data]);

  const awaiting = useMemo(() => buildAwaitingItems(tasks, now), [tasks, now]);
  const decisions = useMemo(() => buildDecisions(tasks), [tasks]);
  const summary = useMemo(() => summarizeInbox(tasks, now), [tasks, now]);

  return { loading, awaiting, decisions, summary };
}
