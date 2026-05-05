'use client';

import { GitBranch } from 'lucide-react';
import {
  DEFAULT_STAGES,
  type StageStatus,
  StageTrack,
} from '@/components/common/stage-track';
import { StatusChip } from '@/components/common/status-chip';
import { Tally } from '@/components/common/tally';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { DetailTabsBar } from './components/detail-tabs-bar';
import { EventsView } from './components/events-view';
import { FailurePanel } from './components/failure-panel';
import { HeroStat } from './components/hero-stat';
import { OverflowMenu } from './components/overflow-menu';
import { StageBody } from './components/stage-body';
import { TraceView } from './components/trace-view';
import { VisualView } from './components/visual-view';
import { formatTokens } from './libs';
import type { StageKey } from './types';
import { useService } from './use-service';

interface TaskDetailProps {
  taskId: string;
}

export function TaskDetail({ taskId }: TaskDetailProps) {
  const {
    loading,
    detail,
    stages,
    stageData,
    selectedStage,
    setSelectedStage,
    tab,
    setTab,
    timings,
    hitlWaited,
    submitReview,
    reviewing,
  } = useService({ taskId });

  if (loading && !detail) {
    return (
      <AppShell scroll={false}>
        <PageHeader
          segments={[{ label: 'Tasks', href: '/tasks' }, { label: 'Loading…' }]}
        />
        <div className="flex flex-1 items-center justify-center text-[12px] text-foreground-subtle">
          Loading task…
        </div>
      </AppShell>
    );
  }
  if (!detail) {
    return (
      <AppShell scroll={false}>
        <PageHeader
          segments={[
            { label: 'Tasks', href: '/tasks' },
            { label: 'Not found' },
          ]}
        />
        <div className="flex flex-1 items-center justify-center text-[12.5px] text-foreground-muted">
          Task not found
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell scroll={false}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PageHeader
          segments={[
            { label: 'Tasks', href: '/tasks' },
            { label: taskId.length > 12 ? `tsk_${taskId.slice(-6)}` : taskId },
          ]}
          actions={<OverflowMenu />}
        />

        {/* Hero */}
        <div className="border-b border-border-faint bg-card px-4 pt-5 pb-3 sm:px-6 lg:px-7">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusChip status={detail.task.status.toUpperCase()} />
            <span className="font-mono text-[10.5px] tabular-nums text-foreground-subtle">
              {taskId}
            </span>
            {detail.task.repo && (
              <span className="inline-flex items-center gap-1.25 rounded-sm border border-border-faint bg-surface-2 px-1.75 py-px font-mono text-[10.5px] text-foreground-muted">
                <GitBranch className="h-2.75 w-2.75" />
                {detail.task.repo.replace(/^https?:\/\/github\.com\//, '')}
              </span>
            )}
          </div>
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <h1 className="m-0 max-w-200 text-[22px] font-semibold leading-[1.2] tracking-normal text-foreground">
                {detail.summary.description || detail.task.title}
              </h1>
              {(detail.task.projectName || detail.task.model) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.04em] text-foreground-subtle">
                  {detail.task.projectName && (
                    <span className="text-foreground-muted">
                      {detail.task.projectName}
                    </span>
                  )}
                  {detail.task.model && (
                    <>
                      <span className="text-foreground-faint">·</span>
                      <span>{detail.task.model}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="hidden items-stretch gap-0 rounded-sm border border-border bg-card md:flex">
              <HeroStat label="DURATION" value={detail.task.duration} />
              <span className="my-2 w-px bg-border-faint" />
              <HeroStat label="COST" value={detail.task.cost} />
              <span className="my-2 w-px bg-border-faint" />
              <HeroStat
                label="TOKENS"
                value={formatTokens(detail.summary.totalTokens)}
              />
            </div>
          </div>
          {detail.task.status === 'failed' && detail.task.error && (
            <FailurePanel
              message={detail.task.error}
              occurredAt={detail.task.completedAt}
            />
          )}
          <Tally className="mt-3" />
        </div>

        <div className="overflow-x-auto border-b border-border bg-card px-4 sm:px-6 lg:px-7">
          <DetailTabsBar tab={tab} onChange={setTab} />
        </div>

        {/* Body */}
        {tab === 'overview' && (
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[244px_1fr]">
            <div className="max-h-64 overflow-y-auto border-b border-border-faint bg-surface-cream/30 p-3 lg:max-h-none lg:border-r lg:border-b-0">
              <div className="flex items-center gap-1.5 px-2.5 pb-3 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground-subtle">
                <span className="inline-block h-1 w-1 rounded-full bg-foreground-faint" />
                Pipeline
              </div>
              <StageTrack
                stages={stages as Partial<Record<string, StageStatus>>}
                currentStage={selectedStage}
                onSelect={(k) => setSelectedStage(k as StageKey)}
                list={DEFAULT_STAGES}
                timings={timings}
              />
              <Tally className="mt-4" />
            </div>

            <div className="overflow-y-auto px-4 py-5 sm:px-6 lg:px-9 lg:py-7">
              <div className="mx-auto max-w-220 pb-12">
                <StageBody
                  stage={selectedStage}
                  status={stages[selectedStage]}
                  stageData={stageData}
                  detail={detail}
                  onReview={submitReview}
                  reviewing={reviewing}
                  hitlWaited={hitlWaited}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'visual' && (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-10 lg:py-6">
            <div className="mx-auto max-w-300">
              <VisualView stageTimings={detail.stageTimings} />
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-10 lg:py-6">
            <div className="mx-auto max-w-240">
              <EventsView entries={detail.activityLog} />
            </div>
          </div>
        )}

        {tab === 'trace' && (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-10 lg:py-6">
            <div className="mx-auto max-w-300">
              <TraceView events={detail.eventInvocations} />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
