import { cn } from '@/utils/cn';

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  /** "Tasks" / "Tasks · Defect resolution" — primary breadcrumb. */
  segments: BreadcrumbSegment[];
  /** Right-side action slot (e.g., "+ New Task" button). */
  actions?: React.ReactNode;
  /** Stickiness — defaults to true so the header pins as content scrolls. */
  sticky?: boolean;
}

/**
 * Linear-style top bar inside the floating main panel. Tight breadcrumb
 * with `/` separators and an optional right-side action slot.
 */
export function PageHeader({
  segments,
  actions,
  sticky = true,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex h-12 items-center justify-between gap-4 border-b border-border-faint bg-card/95 px-5 backdrop-blur-sm',
        sticky && 'sticky top-0 z-20'
      )}
    >
      <nav className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-foreground-muted">
        {segments.map((segment, i) => (
          <div key={segment.label} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-foreground-faint" aria-hidden="true">
                /
              </span>
            )}
            {segment.href ? (
              <a
                href={segment.href}
                className="text-foreground-muted no-underline transition-colors hover:text-foreground"
              >
                {segment.label}
              </a>
            ) : (
              <span
                className={
                  i === segments.length - 1
                    ? 'truncate font-semibold text-foreground'
                    : 'text-foreground-muted'
                }
              >
                {segment.label}
              </span>
            )}
          </div>
        ))}
      </nav>

      {actions && (
        <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
      )}
    </header>
  );
}
