import { Dot } from '../dot';
import { Markdown } from '../markdown';

export interface Concern {
  severity: 'blocking' | 'warning' | 'info' | string;
  text?: string;
  description?: string;
  file?: string;
  suggestion?: string;
}

const SEV: Record<string, { label: string; color: string }> = {
  blocking: { label: 'Blocking', color: 'var(--danger)' },
  warning: { label: 'Warning', color: 'var(--warn)' },
  info: { label: 'Info', color: 'var(--foreground-subtle)' },
};

/**
 * Critic concern card. Severity → leading dot color + label. `file`
 * renders as monospace after the label. `suggestion` shows as a dimmed
 * secondary line prefixed with →.
 */
export function ConcernCard({ concern }: { concern: Concern }) {
  const meta = SEV[concern.severity] ?? SEV.info;
  const body = concern.text ?? concern.description ?? '';
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 py-2.5">
      <div className="mt-1.25">
        <Dot color={meta.color} size={6} />
      </div>
      <div className="flex-1">
        <div className="mb-0.5 flex items-baseline gap-2">
          <span className="text-[12.5px] font-semibold">{meta.label}</span>
          {concern.file && (
            <span className="font-mono text-[11px] text-foreground-subtle">
              {concern.file}
            </span>
          )}
        </div>
        <Markdown className="text-[13px]">{body}</Markdown>
        {concern.suggestion && (
          <div className="mt-1.5 flex items-start gap-1.5 text-foreground-muted">
            <span className="mt-px text-[12px] leading-[1.6]">→</span>
            <Markdown className="text-[12px] text-foreground-muted">
              {concern.suggestion}
            </Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
