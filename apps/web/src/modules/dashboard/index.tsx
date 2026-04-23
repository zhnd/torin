'use client';

import Link from 'next/link';
import { MetricCard } from '@/components/common/metric-card';
import { SectionHead } from '@/components/common/section-head';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { AwaitingReviewTable } from './components/awaiting-review-table';
import { RecentActivity } from './components/recent-activity';
import { useService } from './use-service';

export function Dashboard() {
  const { loading, projects, summary, awaitingRows, activityRows } =
    useService();

  return (
    <AppShell>
      <div className="mx-auto max-w-330 px-4 py-4 md:px-10 md:py-8">
        {/* Header */}
        <div className="mb-7">
          <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">
            Dashboard
          </h1>
          <p className="mt-1 text-[13px] text-foreground-muted">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} ·
            last 7 days
          </p>
        </div>

        {/* Metrics row */}
        <div className="mb-7 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <MetricCard
            label="Awaiting your review"
            value={loading ? '—' : summary.awaitingCount}
            emphasis
            hint={
              summary.awaitingCount > 0
                ? `${summary.awaitingCount} ${summary.awaitingCount === 1 ? 'task' : 'tasks'} need you`
                : 'All clear'
            }
          />
          <MetricCard
            label="Active tasks"
            value={loading ? '—' : summary.activeCount}
            hint={`${summary.runningCount} running · ${summary.queuedCount} queued`}
          />
          <MetricCard
            label="This week's cost"
            value={
              loading
                ? '—'
                : `$${summary.weeklyCost.toFixed(summary.weeklyCost < 10 ? 2 : 0)}`
            }
            hint={`${summary.recentTaskCount} ${summary.recentTaskCount === 1 ? 'task' : 'tasks'} in 7d`}
            sparkTone="accent"
          />
          <MetricCard
            label="Success rate"
            value={
              loading
                ? '—'
                : summary.successRate !== null
                  ? `${summary.successRate}%`
                  : '—'
            }
            hint={
              summary.recentOutcomeCount > 0
                ? `${summary.completedCount}/${summary.completedCount + summary.failedCount} merged`
                : 'No outcomes yet'
            }
          />
        </div>

        {/* Awaiting review */}
        <section className="mb-8">
          <SectionHead
            title="Awaiting your review"
            subtitle="Ordered by oldest first"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks?status=AWAITING_REVIEW">View all</Link>
              </Button>
            }
          />
          <AwaitingReviewTable rows={awaitingRows} />
        </section>

        {/* Recent activity */}
        <section>
          <SectionHead
            title="Recent activity"
            subtitle="Last 10 task transitions"
          />
          <RecentActivity rows={activityRows} />
        </section>
      </div>
    </AppShell>
  );
}
