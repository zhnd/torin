'use client';

import { useQuery } from '@apollo/client';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { RecentTasks } from './components/recent-tasks';
import { StatsCards } from './components/stats-cards';
import { DASHBOARD_QUERY } from './graphql';

export function DashboardPage() {
  const { data, loading } = useQuery(DASHBOARD_QUERY);

  const projects = data?.projects ?? [];
  const tasks = data?.tasks ?? [];
  const runningTasks = tasks.filter(
    (t: { status: string }) => t.status === 'RUNNING'
  ).length;
  const completedTasks = tasks.filter(
    (t: { status: string }) => t.status === 'COMPLETED'
  ).length;

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Overview of your projects and tasks
            </p>
          </div>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <>
            <StatsCards
              projectCount={projects.length}
              totalTasks={tasks.length}
              runningTasks={runningTasks}
              completedTasks={completedTasks}
            />
            <RecentTasks tasks={tasks} />
          </>
        )}
      </div>
    </AppShell>
  );
}
