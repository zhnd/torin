import Link from 'next/link';
import { Dot } from '@/components/common/dot';

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

const EVENT_TONE: Record<string, string> = {
  queued: 'var(--foreground-faint)',
  'stage started': 'var(--accent)',
  'awaiting human review': 'var(--accent)',
  completed: 'var(--ok)',
  failed: 'var(--danger)',
};

/**
 * Compact recent-activity feed — vertical timeline with monospace
 * timestamps, an event-toned bullet, and a wordy event description.
 * Designed to slot into the right column of the dashboard.
 */
export function RecentActivity({ rows }: RecentActivityProps) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-7 text-center text-[12px] text-foreground-subtle">
        No recent activity
      </div>
    );
  }

  return (
    <ol className="relative">
      {/* Vertical rail — 1px line centered on the 8px dot wrapper at li
          left = px-4 (16px) + half wrapper (4px) = 20px */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 top-3 w-px bg-border-faint"
        style={{ left: '19.5px' }}
      />
      {rows.map((a, i) => (
        <li
          // biome-ignore lint/suspicious/noArrayIndexKey: feed is append-only by timestamp; index disambiguates same-second events
          key={`${a.taskId}-${a.time}-${i}`}
          className="relative flex items-start gap-3 px-4 py-2"
        >
          <span className="relative z-10 mt-1.5 flex h-2 w-2 items-center justify-center">
            <Dot
              color={EVENT_TONE[a.event] ?? 'var(--foreground-subtle)'}
              size={6}
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[12.5px] text-foreground">
              <span className="font-medium">{a.event}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] text-foreground-subtle">
              <span>{a.time}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{a.projectName}</span>
              <span aria-hidden="true">·</span>
              <Link
                href={`/tasks/${a.taskId}`}
                className="text-foreground-muted no-underline hover:text-foreground"
              >
                {a.taskId.length > 8 ? `tsk_${a.taskId.slice(-4)}` : a.taskId}
              </Link>
            </div>
          </div>
          <span className="rounded-sm bg-surface-cream px-1.25 py-px font-mono text-[9.5px] font-semibold uppercase tracking-[0.05em] text-foreground-muted">
            {a.stage}
          </span>
        </li>
      ))}
    </ol>
  );
}
