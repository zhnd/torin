import { cn } from '@/utils/cn';

interface MetaRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  last?: boolean;
}

/**
 * Compact label-value row used for project metadata, settings, etc.
 * Stack several inside a bordered `surface` card for Linear-style data
 * density.
 */
export function MetaRow({
  label,
  value,
  mono = false,
  last = false,
}: MetaRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2.5',
        !last && 'border-b border-border'
      )}
    >
      <span className="text-[12px] text-foreground-muted">{label}</span>
      <span className={cn('text-[12px] text-foreground', mono && 'font-mono')}>
        {value}
      </span>
    </div>
  );
}
