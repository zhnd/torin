import { cn } from '@/utils/cn';

interface PanelCardProps {
  /** Panel title — left side of header. */
  title: string;
  /** Tiny right-aligned slot — usually a "View all" button or filter chip. */
  action?: React.ReactNode;
  /** Tiny right-aligned plain text caption (sits before `action`). */
  caption?: string;
  /** Mono section index, e.g. "S.01". Renders before the title. */
  index?: string;
  /** Removes default body padding when caller renders its own table/list. */
  noPad?: boolean;
  /** Apply a subtle accent left-edge stripe for emphasis. */
  emphasis?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Linear-style panel card — flat surface, hairline border, mono section
 * index in the header. The left-edge accent stripe (when `emphasis`)
 * is the indigo bar that signals "this is the active region".
 */
export function PanelCard({
  title,
  action,
  caption,
  index,
  noPad,
  emphasis,
  className,
  children,
}: PanelCardProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-md border border-border bg-card',
        emphasis && 'border-accent/45',
        className
      )}
    >
      {emphasis && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-px bg-accent"
        />
      )}
      <header className="flex items-center justify-between gap-3 border-b border-border-faint px-4 py-2.5">
        <div className="flex items-center gap-2">
          {index && (
            <span className="font-mono text-[10px] tabular-nums text-foreground-faint">
              {index}
            </span>
          )}
          <h3 className="text-[12.5px] font-semibold tracking-normal">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {caption && (
            <span className="font-mono text-[10.5px] text-foreground-subtle">
              {caption}
            </span>
          )}
          {action}
        </div>
      </header>
      <div className={noPad ? '' : 'p-4'}>{children}</div>
    </section>
  );
}
