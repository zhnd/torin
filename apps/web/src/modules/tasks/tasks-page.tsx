'use client';

import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskTable } from './components/task-table';
import { MOCK_TASKS } from './mock-data';

export function TasksPage() {
  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All task executions across your projects
          </p>
        </div>
        <Button size="default" className="rounded-lg px-5">
          <Play className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <TaskTable data={MOCK_TASKS} />
    </div>
  );
}
