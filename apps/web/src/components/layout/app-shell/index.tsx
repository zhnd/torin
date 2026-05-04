import { LeftSidebar } from '@/components/layout/left-sidebar';

interface AppShellProps {
  children: React.ReactNode;
  /**
   * When true (default), the main region scrolls and pages handle their
   * own padding. When false, pages fill the full height with no padding
   * — used for task detail's 2-column internal scroll layout.
   */
  scroll?: boolean;
}

/**
 * Linear-style unified shell: a single outer card surrounds the whole
 * UI. The sidebar lives inside as a left column separated from the
 * main region by a single hairline — no double borders, no gap.
 */
export function AppShell({ children, scroll = true }: AppShellProps) {
  return (
    <div className="h-screen overflow-hidden bg-background p-2.5">
      <div className="flex h-full overflow-hidden rounded-md border border-border bg-card shadow-card">
        <LeftSidebar />
        <main
          className={
            scroll
              ? 'min-h-0 flex-1 overflow-auto pb-14 lg:pb-0'
              : 'flex min-h-0 flex-1 flex-col overflow-hidden pb-14 lg:pb-0'
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
