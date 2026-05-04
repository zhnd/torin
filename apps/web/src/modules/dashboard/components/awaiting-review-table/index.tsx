import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Dot } from '@/components/common/dot';
import { EmptyState } from '@/components/common/empty-state';

export interface AwaitingReviewRow {
  id: string;
  title: string;
  projectName: string;
  stage: string;
  risk: string;
  waited: string;
  branch: string;
}

interface AwaitingReviewTableProps {
  rows: AwaitingReviewRow[];
}

const RISK_COLOR: Record<string, string> = {
  trivial: 'var(--foreground-subtle)',
  low: 'var(--ok)',
  medium: 'var(--warn)',
  high: 'var(--accent)',
  critical: 'var(--danger)',
};

/**
 * Awaiting-review list — used inside a PanelCard with `noPad`. Each row
 * is a tappable Link card; right side has the wait time + an arrow that
 * appears on hover.
 */
export function AwaitingReviewTable({ rows }: AwaitingReviewTableProps) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-7">
        <EmptyState
          title="Nothing awaiting review"
          description="All tasks are currently queued, running, or completed."
        />
      </div>
    );
  }

  return (
    <ol className="divide-y divide-border-faint">
      {rows.map((t) => (
        <li key={t.id}>
          <Link
            href={`/tasks/${t.id}`}
            className="group flex items-center gap-4 px-4 py-3 no-underline transition-colors hover:bg-surface-2"
          >
            <Dot className="sv-awaiting" size={6} pulse />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground">
                  {t.title}
                </span>
                <span className="rounded-sm border border-border bg-surface-cream px-1.5 py-px font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-foreground-muted">
                  {t.stage}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2.5 font-mono text-[10.5px] text-foreground-subtle">
                <span>{t.projectName}</span>
                <span aria-hidden="true">·</span>
                <span>{t.branch}</span>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 text-[11.5px] text-foreground-muted md:inline-flex">
              <Dot color={RISK_COLOR[t.risk] ?? RISK_COLOR.low} size={5} />
              {t.risk}
            </span>
            <div className="text-right">
              <div className="font-mono text-[11.5px] font-medium text-foreground">
                {t.waited}
              </div>
              <div className="text-[10px] uppercase tracking-[0.04em] text-foreground-subtle">
                waiting
              </div>
            </div>
            <span className="text-foreground-faint transition-colors group-hover:text-foreground">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
