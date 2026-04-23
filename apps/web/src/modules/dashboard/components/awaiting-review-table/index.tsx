import Link from 'next/link';
import { Dot } from '@/components/common/dot';
import { EmptyState } from '@/components/common/empty-state';
import { StageTag } from '@/components/common/stage-tag';
import { Button } from '@/components/ui/button';

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

export function AwaitingReviewTable({ rows }: AwaitingReviewTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nothing awaiting review"
        description="All tasks are currently queued, running, or completed."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['Task', 'Project', 'Stage', 'Risk', 'Waited', ''].map((h) => (
              <th
                key={h}
                className="whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11px] font-medium text-foreground-subtle"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child_td]:border-b-0">
          {rows.map((t) => (
            <tr
              key={t.id}
              className="group cursor-pointer transition-colors hover:bg-surface-2"
            >
              <td className="border-b border-border px-3 py-2.5 align-middle">
                <Link
                  href={`/tasks/${t.id}`}
                  className="flex items-center gap-2.5 text-foreground no-underline"
                >
                  <Dot className="sv-awaiting" size={6} pulse />
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-foreground-subtle">
                      {t.id} · {t.branch}
                    </div>
                  </div>
                </Link>
              </td>
              <td className="border-b border-border px-3 py-2.5 align-middle font-mono text-[12px] text-foreground-muted">
                {t.projectName}
              </td>
              <td className="border-b border-border px-3 py-2.5 align-middle">
                <StageTag stage={t.stage} />
              </td>
              <td className="border-b border-border px-3 py-2.5 align-middle">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground-muted">
                  <Dot color={RISK_COLOR[t.risk] ?? RISK_COLOR.low} size={6} />
                  {t.risk}
                </span>
              </td>
              <td className="border-b border-border px-3 py-2.5 align-middle font-mono text-[12px] text-foreground-muted">
                {t.waited}
              </td>
              <td className="border-b border-border px-3 py-2.5 align-middle">
                <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                  <Button asChild size="sm">
                    <Link href={`/tasks/${t.id}`}>Review</Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
