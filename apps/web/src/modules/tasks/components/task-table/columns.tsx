'use client';

import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { ExecutionStatus } from '@torin/domain';
import { ExternalLink, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import type { TaskItem } from '../../types';
import { StageTrack } from '../stage-track';

const col = createColumnHelper<TaskItem>();

const STATUS_DOT: Record<ExecutionStatus, string> = {
  queued: 'bg-muted-foreground/40',
  running: 'bg-emerald-500',
  blocked: 'bg-amber-500',
  needs_review: 'bg-orange-500',
  completed: 'bg-emerald-500',
  failed: 'bg-red-500',
};

const STATUS_BADGE: Record<ExecutionStatus, string> = {
  queued: '',
  running: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blocked: 'bg-amber-50 text-amber-700 border-amber-200',
  needs_review: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

// biome-ignore lint/suspicious/noExplicitAny: tanstack table column helper produces mixed generics
export const columns: ColumnDef<TaskItem, any>[] = [
  col.accessor('title', {
    header: 'Task',
    size: 320,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center shrink-0">
            <div className={cn('h-2 w-2 rounded-full', STATUS_DOT[status])} />
            {status === 'running' && (
              <div className="absolute h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-30" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{row.original.title}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">
              {row.original.repo} / {row.original.branch}
            </p>
          </div>
        </div>
      );
    },
  }),

  col.accessor('status', {
    header: 'Status',
    size: 120,
    cell: ({ getValue }) => {
      const status = getValue() as ExecutionStatus;
      return (
        <Badge
          variant="outline"
          className={cn('text-[10px] capitalize', STATUS_BADGE[status])}
        >
          {status.replace('_', ' ')}
        </Badge>
      );
    },
    filterFn: 'equals',
  }),

  col.display({
    id: 'progress',
    header: 'Progress',
    size: 180,
    cell: ({ row }) => (
      <StageTrack
        stages={row.original.stages}
        stageDetails={row.original.stageDetails}
        size="sm"
        showLabels
      />
    ),
  }),

  col.accessor('workflow', {
    header: 'Workflow',
    size: 120,
    cell: ({ getValue }) => (
      <span className="text-xs font-mono text-muted-foreground">
        {getValue()}
      </span>
    ),
  }),

  col.accessor('duration', {
    header: 'Duration',
    size: 90,
    cell: ({ getValue }) => (
      <span className="text-xs font-mono tabular-nums">{getValue()}</span>
    ),
    sortingFn: (rowA, rowB) => {
      const parse = (d: string) => {
        if (d === '—') return 0;
        const parts = d.match(/(\d+)m\s*(\d+)s/);
        return parts ? Number(parts[1]) * 60 + Number(parts[2]) : 0;
      };
      return parse(rowA.original.duration) - parse(rowB.original.duration);
    },
  }),

  col.accessor('cost', {
    header: 'Cost',
    size: 80,
    cell: ({ getValue }) => (
      <span className="text-xs font-mono tabular-nums font-semibold">
        {getValue()}
      </span>
    ),
    sortingFn: (rowA, rowB) => {
      const parse = (c: string) => Number.parseFloat(c.replace('$', '')) || 0;
      return parse(rowA.original.cost) - parse(rowB.original.cost);
    },
  }),

  col.accessor('model', {
    header: 'Model',
    size: 100,
    cell: ({ getValue }) => (
      <span className="text-xs font-mono text-muted-foreground">
        {getValue().replace('claude-', '').split('-202')[0]}
      </span>
    ),
  }),

  col.accessor('badges', {
    header: 'Alerts',
    size: 120,
    cell: ({ getValue }) => {
      const badges = getValue() as string[];
      if (badges.length === 0) return null;
      return (
        <div className="flex gap-1">
          {badges.map((b) => (
            <span
              key={b}
              className={cn(
                'inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                b === 'failed' &&
                  'bg-red-50 text-red-600 border border-red-200',
                b === 'path_deviation' &&
                  'bg-amber-50 text-amber-600 border border-amber-200',
                b === 'needs_review' &&
                  'bg-orange-50 text-orange-600 border border-orange-200'
              )}
            >
              {b.replace('_', ' ')}
            </span>
          ))}
        </div>
      );
    },
    enableSorting: false,
  }),

  col.display({
    id: 'actions',
    header: '',
    size: 64,
    meta: { sticky: 'right' },
    cell: ({ row }) => (
      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
        <Link
          href={`/tasks/${row.original.id}`}
          className="p-1 rounded hover:bg-accent transition-colors"
          title="Open"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        <button
          type="button"
          className="p-1 rounded hover:bg-accent transition-colors"
          title="Retry"
          onClick={(e) => e.stopPropagation()}
        >
          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    ),
  }),
];
