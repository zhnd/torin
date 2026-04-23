'use client';

import type { StageStatus, TaskStage } from '@torin/domain';
import { TASK_STAGES } from '@torin/domain';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import type { StageDetail } from '../../types';

const STAGE_LABELS: Record<TaskStage, string> = {
  analysis: 'Analysis',
  plan: 'Plan',
  reproduce: 'Repro',
  implement: 'Impl',
  filter: 'Filter',
  critic: 'Critic',
  test: 'Test',
  pr: 'PR',
};

interface StageTrackProps {
  stages: Partial<Record<TaskStage, StageStatus>>;
  stageDetails?: Partial<Record<TaskStage, StageDetail>>;
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

// ── Small size (table rows): dots + lines ──────────────

function dotClass(status: StageStatus): string {
  const base = 'h-2 w-2';
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

function labelClass(status: StageStatus): string {
  switch (status) {
    case 'running':
      return 'text-foreground font-semibold';
    case 'completed':
      return 'text-foreground/70';
    case 'failed':
      return 'text-red-500 font-semibold';
    default:
      return 'text-muted-foreground/60';
  }
}

// ── Medium size (detail page): segmented bar ───────────

function segmentClass(status: StageStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-foreground';
    case 'running':
      return 'bg-foreground animate-pulse';
    case 'failed':
      return 'bg-red-500';
    case 'skipped':
      return 'bg-muted-foreground/20';
    default:
      return 'bg-muted-foreground/15';
  }
}

function segmentLabelClass(status: StageStatus): string {
  switch (status) {
    case 'running':
      return 'text-foreground font-semibold';
    case 'completed':
      return 'text-foreground/70';
    case 'failed':
      return 'text-red-500 font-semibold';
    default:
      return 'text-muted-foreground/50';
  }
}

// ── Tooltip ────────────────────────────────────────────

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
            <p className="max-w-50 truncate">{detail.summary}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────

export function StageTrack({
  stages,
  stageDetails,
  size = 'sm',
  showLabels = false,
}: StageTrackProps) {
  const [hoveredStage, setHoveredStage] = useState<TaskStage | null>(null);

  // Medium size: segmented progress bar
  if (size === 'md') {
    return (
      <div className="flex flex-col gap-1.5 max-w-sm">
        <div className="flex gap-1.5">
          {TASK_STAGES.map((stage) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: hover tooltip on stage indicator
            <div
              key={stage}
              className="relative flex-1"
              onMouseEnter={() => stageDetails && setHoveredStage(stage)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              <div
                className={cn(
                  'h-1.5 rounded-full',
                  segmentClass(stages[stage] ?? 'pending')
                )}
              />
              {hoveredStage === stage && stageDetails?.[stage] && (
                <StageTooltip detail={stageDetails[stage]} stage={stage} />
              )}
            </div>
          ))}
        </div>
        {showLabels && (
          <div className="flex gap-1.5">
            {TASK_STAGES.map((stage) => (
              <span
                key={stage}
                className={cn(
                  'flex-1 text-[10px] leading-none text-center',
                  segmentLabelClass(stages[stage] ?? 'pending')
                )}
              >
                {STAGE_LABELS[stage]}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Small size: dots + lines
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
            <div className={dotClass(stages[stage] ?? 'pending')} />
            {showLabels && (
              <span
                className={cn(
                  'text-[10px] leading-none',
                  labelClass(stages[stage] ?? 'pending')
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
                'h-0.5 w-4 rounded-full mt-0.75',
                lineClass(stages[stage] ?? 'pending')
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
