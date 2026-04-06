import type { EventLevel, TaskStage } from '@torin/domain';
import { AlertTriangle, GitCompareArrows } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import type { TaskDetail } from '../../types';
import { StageTrack } from '../stage-track';

const LEVEL_DOT: Record<EventLevel, string> = {
  info: 'bg-blue-500',
  warn: 'bg-amber-500',
  error: 'bg-red-500',
};

const LEVEL_LINE: Record<EventLevel, string> = {
  info: 'bg-border',
  warn: 'bg-amber-200',
  error: 'bg-red-200',
};

const STAGE_LABELS: Record<TaskStage, string> = {
  analysis: 'Analysis',
  plan: 'Plan',
  implement: 'Implement',
  test: 'Test',
  pr: 'PR',
};

interface TimelineTabProps {
  detail: TaskDetail;
}

export function TimelineTab({ detail }: TimelineTabProps) {
  const { task, timeline, health } = detail;

  const hasDeviation =
    health.missingSteps.length > 0 || task.badges.includes('path_deviation');

  return (
    <div className="space-y-6">
      {/* Path Compare — only show when deviation detected */}
      {hasDeviation && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <GitCompareArrows className="h-4 w-4 text-muted-foreground" />
              Expected vs Actual Path
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs text-muted-foreground">
                Expected
              </span>
              <div className="flex items-center gap-2 text-xs">
                {health.expectedPath.map((stage, i) => (
                  <span key={stage} className="flex items-center gap-2">
                    <span className="font-mono font-medium text-foreground/70">
                      {STAGE_LABELS[stage]}
                    </span>
                    {i < health.expectedPath.length - 1 && (
                      <span className="text-muted-foreground/40">&rarr;</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs text-muted-foreground">
                Actual
              </span>
              <StageTrack
                stages={task.stages}
                stageDetails={task.stageDetails}
                size="md"
                showLabels
              />
            </div>
            {health.missingSteps.length > 0 && (
              <div className="flex items-start gap-2 pt-1">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-700">
                    Deviation detected
                  </p>
                  {health.missingSteps.map((step) => (
                    <p key={step} className="text-xs text-amber-600">
                      Missing step: {step}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {task.badges.includes('path_deviation') &&
              health.missingSteps.length === 0 && (
                <p className="text-xs text-amber-600">
                  Deviation detected at implementation stage — agent switched
                  dependency.
                </p>
              )}
          </CardContent>
        </Card>
      )}

      {/* Timeline Events */}
      <div className="relative space-y-0">
        {timeline.map((event, eventIndex) => (
          <div
            key={`${event.timestamp}-${event.event}`}
            className="flex gap-3 pb-3"
          >
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-2 w-2 rounded-full shrink-0 mt-1.5',
                  LEVEL_DOT[event.level]
                )}
              />
              {eventIndex < timeline.length - 1 && (
                <div className={cn('w-px flex-1', LEVEL_LINE[event.level])} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 capitalize"
                >
                  {event.stage}
                </Badge>
                {event.agent && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 font-mono"
                  >
                    {event.agent}
                  </Badge>
                )}
                {event.tool && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 font-mono bg-blue-50 text-blue-700"
                  >
                    {event.tool}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground font-mono ml-auto">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p
                className={cn(
                  'mt-0.5 text-sm',
                  event.level === 'error' && 'text-red-600 font-medium',
                  event.level === 'warn' && 'text-amber-700'
                )}
              >
                {event.event}
              </p>
              {event.details && (
                <p className="mt-0.5 text-xs font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1 mt-1">
                  {event.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
