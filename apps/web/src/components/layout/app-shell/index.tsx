import { AppHeader } from '@/components/layout/app-header';
import { LeftSidebar } from '@/components/layout/left-sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <LeftSidebar />
      <div className="lg:pl-56 flex flex-col flex-1 min-h-0">
        <AppHeader />
        <main className="flex-1 min-h-0 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      {/* Bottom nav spacer for mobile */}
      <div className="h-16 lg:hidden shrink-0" />
    </div>
  );
}
