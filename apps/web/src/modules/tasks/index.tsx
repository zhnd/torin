'use client';

import {
  type MiniStageStatus,
  MiniTrack,
} from '@/components/common/mini-track';
import { RiskBadge } from '@/components/common/risk-badge';
import { StatusChip } from '@/components/common/status-chip';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { TASK_FILTERS } from './constants';
import { formatCost, formatDuration, humanizeTaskType } from './libs';
import { useService } from './use-service';

export function Tasks() {
  const { loading, status, setStatus, all, counts, rows, openTask } =
    useService();

  return (
    <AppShell>
      <div className="mx-auto max-w-330 px-4 py-4 md:px-10 md:py-8">
        <div className="mb-5">
          <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">
            Tasks
          </h1>
          <p className="m-0 mt-1 text-[13px] text-foreground-muted">
            {all.length} tasks · updated live
          </p>
        </div>

        <div className="mb-3 flex border-b border-border">
          {TASK_FILTERS.map((f, i) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.key)}
              className={cn(
                '-mb-px cursor-pointer border-none bg-transparent py-1.75 text-[12.5px] transition-colors',
                i === 0 ? 'pr-3' : 'px-3',
                status === f.key
                  ? 'border-b-[1.5px] border-foreground font-semibold text-foreground'
                  : 'border-b-[1.5px] border-transparent font-medium text-foreground-muted hover:text-foreground'
              )}
            >
              {f.label}{' '}
              <span className="ml-0.5 font-mono text-[11px] text-foreground-subtle">
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-md border border-border bg-surface">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Status', 'Task', 'Project', 'Stage', 'Time', 'Cost'].map(
                  (h) => (
                    <th
                      key={h}
                      className={cn(
                        'whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11px] font-medium text-foreground-subtle',
                        (h === 'Time' || h === 'Cost') && 'text-right'
                      )}
                    >
                      {h}
                    </th>
                  )
                )}
                <th className="w-28 border-b border-border" />
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-b-0">
              {rows.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => openTask(t.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') openTask(t.id);
                  }}
                  className="group cursor-pointer transition-colors hover:bg-surface-2"
                >
                  <td className="border-b border-border px-3 py-2.5 align-middle">
                    <StatusChip status={t.status} />
                  </td>
                  <td className="border-b border-border px-3 py-2.5 align-middle">
                    <div className="font-medium">
                      {humanizeTaskType(t.type)}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-foreground-subtle">
                      {t.id}
                    </div>
                  </td>
                  <td className="border-b border-border px-3 py-2.5 align-middle font-mono text-[12px] text-foreground-muted">
                    {t.project?.name ?? '—'}
                  </td>
                  <td className="border-b border-border px-3 py-2.5 align-middle">
                    <MiniTrack
                      stages={
                        (t.stages ?? {}) as Partial<
                          Record<string, MiniStageStatus>
                        >
                      }
                    />
                  </td>
                  <td className="border-b border-border px-3 py-2.5 text-right align-middle font-mono text-[12px] text-foreground-muted">
                    {formatDuration(t.durationMs)}
                  </td>
                  <td className="border-b border-border px-3 py-2.5 text-right align-middle font-mono text-[12px]">
                    {formatCost(t.totalCostUsd)}
                  </td>
                  <td className="border-b border-border px-3 py-2.5 align-middle">
                    <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTask(t.id);
                        }}
                      >
                        Open
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-[12px] text-foreground-subtle"
                  >
                    {status !== 'all'
                      ? 'No tasks match the current filter.'
                      : 'No tasks yet. Create a project to get started.'}
                  </td>
                </tr>
              )}
              {loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-[12px] text-foreground-subtle"
                  >
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Risk legend — secondary info */}
        <div className="mt-3 flex items-center gap-3 text-[11px] text-foreground-subtle">
          <span>Risk:</span>
          {['trivial', 'low', 'medium', 'high', 'critical'].map((r) => (
            <RiskBadge key={r} risk={r} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
