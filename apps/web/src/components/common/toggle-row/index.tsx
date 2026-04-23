'use client';

import { cn } from '@/utils/cn';
import type { ToggleRowProps } from './types';
import { useService } from './use-service';

export function ToggleRow({
  label,
  description,
  defaultChecked,
  onChange,
  last = false,
}: ToggleRowProps) {
  const { on, toggle } = useService({ defaultChecked, onChange });

  return (
    <div
      className={cn(
        'flex items-start gap-3.5 py-3',
        !last && 'border-b border-border'
      )}
    >
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'relative mt-0.5 h-4 w-7 shrink-0 cursor-pointer rounded-full border-none transition-colors',
          on ? 'bg-foreground' : 'bg-border-strong'
        )}
        aria-pressed={on}
        aria-label={label}
      >
        <span
          className="absolute top-0.5 h-3 w-3 rounded-full bg-background transition-[left]"
          style={{ left: on ? '14px' : '2px' }}
        />
      </button>
      <div className="flex-1">
        <div className="text-[13px] font-medium">{label}</div>
        {description && (
          <div className="mt-0.5 text-[11.5px] text-foreground-muted">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
