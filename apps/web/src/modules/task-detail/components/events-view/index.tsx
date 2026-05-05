import { Dot } from '@/components/common/dot';
import { StageTag } from '@/components/common/stage-tag';
import type { ActivityLogEntry } from '@/modules/tasks/types';
import { CATEGORY_LABEL, CATEGORY_TONE } from './constants';

/**
 * Activity log: chronological feed of stage transitions, agent
 * invocation start/end, and per-tool calls. Built upstream in
 * `tasks/transform.ts:buildActivityLog`.
 */
export function EventsView({ entries }: { entries: ActivityLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface px-4 py-8 text-center text-[12.5px] text-foreground-muted">
        No activity recorded yet.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-border bg-surface py-1 font-mono text-[11.5px]">
      {entries.map((e) => (
        <div
          key={e.id}
          className="flex items-center gap-3 px-3.5 py-1.25 leading-[1.55]"
        >
          <span className="w-17.5 text-foreground-subtle">
            {new Date(e.timestamp).toLocaleTimeString()}
          </span>
          <span
            className="w-12.5 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: CATEGORY_TONE[e.category] }}
          >
            {CATEGORY_LABEL[e.category]}
          </span>
          <span className="w-22.5 shrink-0">
            <StageTag stage={e.stage} />
          </span>
          <span className="flex-1 truncate font-sans text-[12.5px] text-foreground">
            {e.title}
          </span>
          {e.detail && (
            <span className="shrink-0 text-foreground-subtle">{e.detail}</span>
          )}
          {e.level === 'error' && <Dot color="var(--danger)" size={5} />}
          {e.level === 'warn' && <Dot color="var(--warn)" size={5} />}
          {e.category === 'tool' && e.success === true && (
            <Dot color="var(--ok)" size={5} />
          )}
        </div>
      ))}
    </div>
  );
}
