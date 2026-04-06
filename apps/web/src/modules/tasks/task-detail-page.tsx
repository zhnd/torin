'use client';

import { useQuery } from '@apollo/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { TaskDetailPane } from './components/task-detail-pane';
import { GET_TASK } from './graphql';
import { transformTaskToDetail } from './transform';

interface TaskDetailPageProps {
  taskId: string;
}

export function TaskDetailPage({ taskId }: TaskDetailPageProps) {
  const { data, loading, refetch } = useQuery(GET_TASK, {
    variables: { id: taskId },
    pollInterval: 3000,
  });

  const task = data?.task;

  return (
    <AppShell>
      <div className="flex flex-col h-full gap-4">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tasks
        </Link>

        {loading && !task ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : !task ? (
          <div className="text-sm text-muted-foreground">Task not found</div>
        ) : (
          <TaskDetailPane
            detail={transformTaskToDetail(task)}
            taskId={task.id}
            rawResult={task.result}
            onReviewed={() => refetch()}
          />
        )}
      </div>
    </AppShell>
  );
}
