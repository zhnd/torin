'use client';

import { useQuery } from '@apollo/client';
import { TaskTable } from './components/task-table';
import { GET_TASKS } from './graphql';
import { transformTaskToItem } from './transform';

export function TasksPage() {
  const { data, loading } = useQuery(GET_TASKS, {
    pollInterval: 5000,
  });

  const tasks = (data?.tasks ?? []).map(transformTaskToItem);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All task executions across your projects
        </p>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <TaskTable data={tasks} />
      )}
    </div>
  );
}
