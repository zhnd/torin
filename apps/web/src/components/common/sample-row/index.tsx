import { cn } from '@/utils/cn';
import { Chip } from '../chip';

export interface Sample {
  id: string;
  status: 'selected' | 'filter_failed' | 'critic_rejected' | string;
  note?: string;
  time?: string;
  branch?: string;
}

const TONE: Record<string, { dot: string; label: string }> = {
  selected: { dot: 'var(--ok)', label: 'Selected' },
  filter_failed: { dot: 'var(--danger)', label: 'Filter failed' },
  critic_rejected: { dot: 'var(--warn)', label: 'Critic rejected' },
};

export function SampleRow({
  sample,
  selected,
  onClick,
}: {
  sample: Sample;
  selected?: boolean;
  onClick?: () => void;
}) {
  const tone = TONE[sample.status] ?? {
    dot: 'var(--foreground-subtle)',
    label: sample.status,
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border bg-surface px-3 py-2 text-left',
        selected ? 'border-foreground' : 'border-border'
      )}
    >
      <span className="w-6 font-mono text-[11.5px] font-medium text-foreground-subtle">
        {sample.id}
      </span>
      <Chip dot={tone.dot}>{tone.label}</Chip>
      {sample.note && (
        <span className="flex-1 truncate text-[12px] text-foreground-muted">
          {sample.note}
        </span>
      )}
      {sample.time && (
        <span className="font-mono text-[10.5px] text-foreground-subtle">
          {sample.time}
        </span>
      )}
    </button>
  );
}
