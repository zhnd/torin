'use client';

import type { ExecutionStatus } from '@torin/domain';
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  GitBranch,
  GitFork,
  Maximize2,
  MoreHorizontal,
  Pause,
  Pencil,
  RotateCcw,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TaskDetail } from '../../types';
import { CostTab } from '../detail-tabs/cost-tab';
import { DiffTab } from '../detail-tabs/diff-tab';
import { LogsTab } from '../detail-tabs/logs-tab';
import { OverviewTab } from '../detail-tabs/overview-tab';
import { ReplayTab } from '../detail-tabs/replay-tab';
import { TimelineTab } from '../detail-tabs/timeline-tab';
import { StageTrack } from '../stage-track';

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
}

export function TaskDetailPane({ detail }: TaskDetailPaneProps) {
  const { task } = detail;
  const hasPendingApproval = detail.approvals.some(
    (a) => a.status === 'pending'
  );

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border px-5 py-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight truncate">
                {task.title}
              </h2>
              <button
                type="button"
                className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={STATUS_BADGE[task.status]}>
                {task.status.replace('_', ' ')}
              </Badge>
              <span className="text-muted-foreground/30">|</span>
              <Badge variant="outline" className="capitalize text-[11px]">
                {task.currentStage}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {hasPendingApproval && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="mr-1.5 h-3 w-3" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Ban className="mr-1.5 h-3 w-3" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs rounded-lg"
                >
                  <ArrowRight className="mr-1.5 h-3 w-3" />
                  Continue
                </Button>
                <div className="w-px h-5 bg-border mx-1" />
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-lg"
            >
              <Pause className="mr-1.5 h-3 w-3" />
              Pause
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-lg"
            >
              <XCircle className="mr-1.5 h-3 w-3" />
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-lg"
            >
              <RotateCcw className="mr-1.5 h-3 w-3" />
              Retry
            </Button>
            <button
              type="button"
              className="ml-1 p-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="p-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5 font-mono">
            <GitFork className="h-3 w-3" />
            {task.repo}
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <GitBranch className="h-3 w-3" />
            {task.branch}
          </span>
          <span className="flex items-center gap-1.5">
            <Workflow className="h-3 w-3" />
            {task.workflow}
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3 w-3" />
            {task.triggerSource}
          </span>
          <span className="text-muted-foreground/30">|</span>
          <span className="font-mono font-semibold tabular-nums">
            {task.duration}
          </span>
          <span className="font-mono font-semibold tabular-nums">
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
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-5 mt-0 justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
          {['Overview', 'Timeline', 'Logs', 'Diff', 'Cost', 'Replay'].map(
            (tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase()}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2.5 pt-2.5 text-xs font-medium"
              >
                {tab}
              </TabsTrigger>
            )
          )}
        </TabsList>

        <div className="flex-1 overflow-y-auto p-5">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab detail={detail} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            <TimelineTab detail={detail} />
          </TabsContent>
          <TabsContent value="logs" className="mt-0">
            <LogsTab logs={detail.logs} />
          </TabsContent>
          <TabsContent value="diff" className="mt-0">
            <DiffTab files={detail.diff} />
          </TabsContent>
          <TabsContent value="cost" className="mt-0">
            <CostTab breakdown={detail.cost} />
          </TabsContent>
          <TabsContent value="replay" className="mt-0">
            <ReplayTab steps={detail.replay} currentStage={task.currentStage} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
