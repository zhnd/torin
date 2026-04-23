import { cn } from '@/utils/cn';
import { Dot } from '../dot';

interface ChipProps {
  children: React.ReactNode;
  dot?: string;
  dotClass?: string;
  pulse?: boolean;
  strong?: boolean;
  mono?: boolean;
  className?: string;
}

/**
 * Linear-style chip: just a leading dot + label. No fill, no border.
 * Density/weight are the only variant knobs.
 */
export function Chip({
  children,
  dot,
  dotClass,
  pulse = false,
  strong = false,
  mono = false,
  className,
}: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] leading-[1.5]',
        strong
          ? 'font-semibold text-foreground'
          : 'font-medium text-foreground-muted',
        mono && 'font-mono',
        className
      )}
    >
      {(dot || dotClass) && (
        <Dot color={dot} pulse={pulse} className={dotClass} />
      )}
      {children}
    </span>
  );
}
