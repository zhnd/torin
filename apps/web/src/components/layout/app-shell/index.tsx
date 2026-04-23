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
 * App shell: sidebar + main. No top header bar — pages render their own
 * page-level header inside the main region. Theme toggle lives in the
 * sidebar's footer next to the user row.
 */
export function AppShell({ children, scroll = true }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <LeftSidebar />
      <div className="flex min-h-0 flex-1 flex-col lg:pl-56">
        <main
          className={
            scroll
              ? 'min-h-0 flex-1 overflow-auto'
              : 'flex min-h-0 flex-1 flex-col overflow-hidden'
          }
        >
          {children}
        </main>
      </div>
      {/* Bottom nav spacer for mobile */}
      <div className="h-16 shrink-0 lg:hidden" />
    </div>
  );
}
