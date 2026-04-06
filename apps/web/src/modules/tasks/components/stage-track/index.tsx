'use client';

import type { StageStatus, TaskStage } from '@torin/domain';
import { TASK_STAGES } from '@torin/domain';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import type { StageDetail } from '../../types';

const STAGE_LABELS: Record<TaskStage, string> = {
  analysis: 'Analysis',
  plan: 'Plan',
  implement: 'Impl',
  test: 'Test',
  pr: 'PR',
};

interface StageTrackProps {
  stages: Record<TaskStage, StageStatus>;
  stageDetails?: Record<TaskStage, StageDetail>;
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

function dotClass(status: StageStatus, size: 'sm' | 'md'): string {
  const base = size === 'sm' ? 'h-[6px] w-[6px]' : 'h-[9px] w-[9px]';

  switch (status) {
    case 'completed':
      return cn(base, 'bg-foreground rounded-full');
    case 'running':
      return cn(
        base,
        'bg-foreground rounded-full ring-[3px] ring-foreground/15'
      );
    case 'failed':
      return cn(base, 'bg-red-500 rounded-full ring-[3px] ring-red-500/15');
    case 'skipped':
      return cn(base, 'bg-muted-foreground/25 rounded-full');
    default:
      return cn(
        base,
        'rounded-full border-[1.5px] border-muted-foreground/30 bg-transparent'
      );
  }
}

function lineClass(fromStatus: StageStatus): string {
  switch (fromStatus) {
    case 'completed':
      return 'bg-foreground/50';
    case 'running':
      return 'bg-foreground/20';
    case 'failed':
      return 'bg-red-300/50';
    default:
      return 'bg-muted-foreground/15';
  }
}

function StageTooltip({
  detail,
  stage,
}: {
  detail: StageDetail;
  stage: TaskStage;
}) {
  if (detail.status === 'pending') return null;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
      <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap">
        <p className="font-semibold capitalize mb-1">{STAGE_LABELS[stage]}</p>
        <div className="space-y-0.5 text-muted-foreground">
          {detail.duration !== '—' && (
            <p>
              <span className="text-foreground font-mono">
                {detail.duration}
              </span>{' '}
              duration
            </p>
          )}
          {detail.toolCalls > 0 && (
            <p>
              <span className="text-foreground font-mono">
                {detail.toolCalls}
              </span>{' '}
              tool calls
            </p>
          )}
          {detail.summary && (
            <p className="max-w-[200px] truncate">{detail.summary}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function StageTrack({
  stages,
  stageDetails,
  size = 'sm',
  showLabels = false,
}: StageTrackProps) {
  const lineWidth = size === 'sm' ? 'w-3' : 'w-6';
  const [hoveredStage, setHoveredStage] = useState<TaskStage | null>(null);

  return (
    <div className="flex items-start gap-0">
      {TASK_STAGES.map((stage, i) => (
        <div key={stage} className="flex items-start">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: hover tooltip on stage indicator */}
          <div
            className="relative flex flex-col items-center gap-1"
            onMouseEnter={() => stageDetails && setHoveredStage(stage)}
            onMouseLeave={() => setHoveredStage(null)}
          >
            <div className={dotClass(stages[stage], size)} />
            {showLabels && (
              <span
                className={cn(
                  size === 'sm' ? 'text-[9px]' : 'text-[10px]',
                  'leading-none',
                  stages[stage] === 'running'
                    ? 'text-foreground font-semibold'
                    : stages[stage] === 'completed'
                      ? 'text-foreground/70'
                      : stages[stage] === 'failed'
                        ? 'text-red-500 font-semibold'
                        : 'text-muted-foreground/60'
                )}
              >
                {STAGE_LABELS[stage]}
              </span>
            )}
            {hoveredStage === stage && stageDetails?.[stage] && (
              <StageTooltip detail={stageDetails[stage]} stage={stage} />
            )}
          </div>
          {i < TASK_STAGES.length - 1 && (
            <div
              className={cn(
                'h-[1.5px] rounded-full mt-[2.5px]',
                size === 'md' && 'mt-[4px]',
                lineWidth,
                lineClass(stages[stage])
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
