import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  SkipForward,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import type { ReplayStep } from '../../types';

const STATUS_ICON = {
  completed: CheckCircle2,
  failed: XCircle,
  skipped: SkipForward,
};

const STATUS_COLOR = {
  completed: 'text-emerald-500',
  failed: 'text-red-500',
  skipped: 'text-muted-foreground',
};

interface ReplayTabProps {
  steps: ReplayStep[];
  currentStage?: string;
}

export function ReplayTab({ steps }: ReplayTabProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const lastCompletedIndex = steps.reduce(
    (acc, step, i) => (step.status === 'completed' ? i : acc),
    -1
  );

  return (
    <div className="space-y-1">
      {steps.map((step) => {
        const isExpanded = expandedIndex === step.index;
        const isCurrent = step.index === lastCompletedIndex + 2;
        const Icon = STATUS_ICON[step.status];

        return (
          <div
            key={step.index}
            className={cn(
              'rounded-lg border transition-colors',
              isCurrent
                ? 'border-foreground/20 bg-accent'
                : 'border-border bg-card'
            )}
          >
            <button
              type="button"
              onClick={() => setExpandedIndex(isExpanded ? null : step.index)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left cursor-pointer"
            >
              <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">
                #{step.index}
              </span>
              <Icon
                className={cn('h-4 w-4 shrink-0', STATUS_COLOR[step.status])}
              />
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 shrink-0"
              >
                {step.stage}
              </Badge>
              <span className="flex-1 truncate text-sm">{step.action}</span>
              <span className="shrink-0 text-xs font-mono text-muted-foreground">
                {step.duration}
              </span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-border px-3 py-3 space-y-2">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Input
                  </p>
                  <p className="mt-0.5 text-xs font-mono bg-muted/50 rounded px-2 py-1.5">
                    {step.input}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Output
                  </p>
                  <p className="mt-0.5 text-xs font-mono bg-muted/50 rounded px-2 py-1.5">
                    {step.output}
                  </p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Model
                    </p>
                    <p className="mt-0.5 text-xs font-mono">
                      {step.model.replace('claude-', '').split('-202')[0]}
                    </p>
                  </div>
                  {step.tools.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Tools
                      </p>
                      <div className="mt-0.5 flex gap-1">
                        {step.tools.map((tool) => (
                          <Badge
                            key={tool}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-mono"
                          >
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
