import Link from 'next/link';
import { StageTag } from '@/components/common/stage-tag';

export interface ActivityRow {
  time: string;
  taskId: string;
  projectName: string;
  stage: string;
  event: string;
}

interface RecentActivityProps {
  rows: ActivityRow[];
}

/**
 * Compact recent-activity feed — one row per stage transition across
 * tasks. Monospace timestamps + wordy event text, no borders between
 * rows (hairlines would be noisy at this density).
 */
export function RecentActivity({ rows }: RecentActivityProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface px-4 py-6 text-center text-[12px] text-foreground-subtle">
        No recent activity
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface py-1">
      {rows.map((a, i) => (
        <div
          key={`${a.taskId}-${a.time}-${i}`}
          className="flex items-center gap-3.5 px-3.5 py-1.75 font-mono text-[11.5px]"
        >
          <span className="w-13.5 text-foreground-subtle">{a.time}</span>
          <span className="w-17">
            <StageTag stage={a.stage} />
          </span>
          <span className="w-32.5 truncate text-foreground-muted">
            {a.projectName}
          </span>
          <span className="flex-1 font-sans text-[12.5px] text-foreground">
            {a.event}
          </span>
          <Link
            href={`/tasks/${a.taskId}`}
            className="font-mono text-[11px] text-foreground-subtle no-underline hover:text-foreground"
          >
            {a.taskId.length > 8 ? `tsk_${a.taskId.slice(-4)}` : a.taskId}
          </Link>
        </div>
      ))}
    </div>
  );
}
