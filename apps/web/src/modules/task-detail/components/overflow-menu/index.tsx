import { MoreHorizontal } from 'lucide-react';

export function OverflowMenu() {
  return (
    <button
      type="button"
      title="More actions"
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
    >
      <MoreHorizontal className="h-3.5 w-3.5" />
    </button>
  );
}
