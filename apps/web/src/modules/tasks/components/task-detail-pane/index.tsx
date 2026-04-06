'use client';

import type { ExecutionStatus } from '@torin/domain';
import { GitFork, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TaskDetail } from '../../types';
import { CostTab } from '../detail-tabs/cost-tab';
import { DiffTab } from '../detail-tabs/diff-tab';
import { OverviewTab } from '../detail-tabs/overview-tab';
import { TimelineTab } from '../detail-tabs/timeline-tab';
import { DiffReviewPanel } from '../diff-review-panel';
import { StageTrack } from '../stage-track';
import { TaskReviewPanel } from '../task-review-panel';

const STATUS_BADGE: Record<ExecutionStatus, string> = {
  queued: 'bg-muted text-muted-foreground',
  running: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blocked: 'bg-amber-50 text-amber-700 border-amber-200',
  needs_review: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

interface TaskDetailPaneProps {
  detail: TaskDetail;
  taskId: string;
  rawResult?: Record<string, unknown> | null;
  onReviewed?: () => void;
}

export function TaskDetailPane({
  detail,
  taskId,
  rawResult,
  onReviewed,
}: TaskDetailPaneProps) {
  const { task } = detail;
  const isAwaitingReview = task.status === 'needs_review';
  const hasAnalysisReview = isAwaitingReview && rawResult?.analysis;
  const hasDiffReview = isAwaitingReview && rawResult?.diff;

  const tabs = ['Overview', 'Timeline', 'Diff', 'Cost'];
  if (isAwaitingReview) tabs.splice(1, 0, 'Review');

  const defaultTab = isAwaitingReview ? 'review' : 'overview';

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border px-5 py-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <h2 className="text-lg font-bold leading-tight truncate">
              {task.title}
            </h2>
            <Badge variant="outline" className={STATUS_BADGE[task.status]}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-mono">
            <GitFork className="h-3 w-3" />
            {task.repo}
          </span>
          {task.model && (
            <span className="flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              {task.model.replace('claude-', '').split('-202')[0]}
            </span>
          )}
          <span className="ml-auto font-mono font-semibold tabular-nums text-foreground">
            {task.duration}
          </span>
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {task.cost}
          </span>
        </div>

        <StageTrack
          stages={task.stages}
          stageDetails={task.stageDetails}
          size="md"
          showLabels
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-5 pt-3">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab.toLowerCase()}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab detail={detail} />
          </TabsContent>

          {isAwaitingReview && (
            <TabsContent value="review" className="mt-0">
              {hasAnalysisReview ? (
                <TaskReviewPanel
                  taskId={taskId}
                  analysis={rawResult?.analysis as Record<string, unknown>}
                  onReviewed={onReviewed}
                />
              ) : hasDiffReview ? (
                <DiffReviewPanel
                  taskId={taskId}
                  data={rawResult as Record<string, unknown>}
                  onReviewed={onReviewed}
                />
              ) : null}
            </TabsContent>
          )}

          <TabsContent value="timeline" className="mt-0">
            <TimelineTab detail={detail} />
          </TabsContent>
          <TabsContent value="diff" className="mt-0">
            <DiffTab files={detail.diff} />
          </TabsContent>
          <TabsContent value="cost" className="mt-0">
            <CostTab breakdown={detail.cost} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
