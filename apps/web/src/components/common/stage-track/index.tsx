import { cn } from '@/utils/cn';

export type StageStatus =
  | 'pending'
  | 'running'
  | 'awaiting'
  | 'done'
  | 'auto'
  | 'failed'
  | 'skipped';

export interface StageItem {
  key: string;
  label: string;
}

export const DEFAULT_STAGES: StageItem[] = [
  { key: 'analyze', label: 'Analyze' },
  { key: 'reproduce', label: 'Reproduce' },
  { key: 'implement', label: 'Implement' },
  { key: 'filter', label: 'Filter' },
  { key: 'critic', label: 'Critic' },
  { key: 'hitl', label: 'HITL-final' },
  { key: 'pr', label: 'Pull request' },
];

interface StageTrackProps {
  stages: Partial<Record<string, StageStatus>>;
  currentStage?: string;
  onSelect?: (key: string) => void;
  list?: StageItem[];
  timings?: Partial<Record<string, string>>;
}

/**
 * Vertical stage track used on the task detail page. Each row is a dot +
 * label + time. Click a row to route the detail pane. Thin connecting
 * line between dots darkens as stages complete.
 */
export function StageTrack({
  stages,
  currentStage,
  onSelect,
  list = DEFAULT_STAGES,
  timings = {},
}: StageTrackProps) {
  return (
    <ol className="m-0 list-none p-0">
      {list.map((s, i) => {
        const st = stages[s.key] ?? 'pending';
        const selected = currentStage === s.key;
        const isLast = i === list.length - 1;
        const lineColor =
          st === 'done' || st === 'auto'
            ? 'var(--foreground)'
            : st === 'failed'
              ? 'var(--danger)'
              : 'var(--border)';
        return (
          <li key={s.key} className="relative">
            {!isLast && (
              <span
                className="absolute bottom-[-4px] top-6 w-px"
                style={{
                  left: '15px',
                  background: lineColor,
                  opacity:
                    st === 'done' || st === 'auto' || st === 'failed' ? 1 : 0.9,
                }}
              />
            )}
            <button
              type="button"
              onClick={() => onSelect?.(s.key)}
              className={cn(
                'mb-0.5 flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] border-none px-2.5 py-1.75 text-left transition-colors',
                selected ? 'bg-surface-2' : 'bg-transparent hover:bg-surface-2'
              )}
            >
              <StageDot status={st} />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={cn(
                    'flex-1 truncate text-[13px]',
                    selected ? 'font-semibold' : 'font-medium',
                    st === 'pending'
                      ? 'text-foreground-subtle'
                      : 'text-foreground'
                  )}
                >
                  {s.label}
                </span>
                <span className="font-mono text-[10.5px] text-foreground-subtle">
                  {timings[s.key] ?? ''}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function StageDot({ status }: { status: StageStatus }) {
  const base =
    'ml-1 mr-0.75 flex h-3 w-3 shrink-0 items-center justify-center rounded-full';
  if (status === 'done' || status === 'auto')
    return (
      <div className={cn(base, 'bg-foreground')}>
        <Check size={7} />
      </div>
    );
  if (status === 'failed')
    return (
      <div className={cn(base, 'bg-[color:var(--danger)]')}>
        <Cross size={6} />
      </div>
    );
  if (status === 'running')
    return (
      <div className={cn(base, 'relative bg-[color:var(--accent)]')}>
        <span
          className="block h-1.75 w-1.75 animate-spin rounded-full border-[1.5px] border-white/35"
          style={{ borderTopColor: 'white' }}
        />
      </div>
    );
  if (status === 'awaiting')
    return (
      <div className={cn(base, 'relative bg-[color:var(--accent)]')}>
        <span className="block h-0.75 w-0.75 rounded-full bg-white" />
        <span className="torin-ping absolute -inset-px rounded-full bg-[color:var(--accent)] opacity-[0.35]" />
      </div>
    );
  if (status === 'skipped')
    return (
      <div
        className={cn(
          base,
          'border border-dashed border-border-strong bg-transparent'
        )}
      />
    );
  return (
    <div className={cn(base, 'border border-border-strong bg-transparent')} />
  );
}

function Check({ size = 8 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      role="img"
      aria-hidden="true"
    >
      <path
        d="M2 6.5L5 9L10 3.5"
        stroke="var(--background)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Cross({ size = 7 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      fill="none"
      role="img"
      aria-hidden="true"
    >
      <path
        d="M1 1L7 7M7 1L1 7"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
