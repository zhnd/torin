'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { TaskDetailPane } from './components/task-detail-pane';
import { MOCK_TASK_DETAILS } from './mock-data';

interface TaskDetailPageProps {
  taskId: string;
}

export function TaskDetailPage({ taskId }: TaskDetailPageProps) {
  const detail = MOCK_TASK_DETAILS[taskId] ?? null;

  return (
    <AppShell>
      <div className="space-y-4">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tasks
        </Link>

        {detail ? (
          <TaskDetailPane detail={detail} />
        ) : (
          <div className="text-sm text-muted-foreground">Task not found</div>
        )}
      </div>
    </AppShell>
  );
}
