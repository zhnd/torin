'use client';

import { LogOut, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Dot } from '@/components/common/dot';
import { authClient } from '@/libs/auth-client';
import { cn } from '@/utils/cn';
import { NAVIGATION_ITEMS } from './constants';

export function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const currentTheme = mounted
    ? theme === 'system'
      ? resolvedTheme
      : theme
    : null;

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/login');
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-border bg-sidebar px-2.5 py-3.5 lg:flex">
        {/* Logo + org */}
        <div className="px-2 pb-4.5 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-foreground text-[12px] font-bold tracking-[-0.05em] text-background">
              T
            </div>
            <span className="text-[14px] font-semibold tracking-[-0.015em] text-foreground">
              Torin
            </span>
            <div className="flex-1" />
            <span className="font-mono text-[10px] text-foreground-subtle">
              {user?.email?.split('@')[1]?.split('.')[0] ?? 'local'}
            </span>
          </div>
        </div>

        {/* Workspace group label */}
        <div className="px-2 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-foreground-subtle">
          Workspace
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-px">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.25 py-1.5 text-[13px] transition-colors',
                  isActive
                    ? 'bg-surface-2 font-semibold text-foreground'
                    : 'font-medium text-foreground-muted hover:bg-surface-2'
                )}
              >
                <span
                  className={cn(
                    'ml-0.5 h-1 w-1 rounded-full',
                    isActive ? 'bg-foreground' : 'bg-transparent'
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Agent pool status */}
        <div className="flex items-center gap-2 px-2.5 py-2 text-[11px] text-foreground-muted">
          <Dot className="sv-running" size={5} pulse />
          <span className="flex-1">Agent pool · healthy</span>
          <span className="font-mono text-[10px] text-foreground-subtle">
            3/8
          </span>
        </div>

        {/* User row */}
        <div className="mt-1.5 flex items-center gap-2.5 border-t border-border px-2 pt-2.5">
          <div className="flex h-5.5 w-5.5 items-center justify-center rounded-full border border-border bg-surface-inset text-[11px] font-semibold">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium">
              {user?.name ?? 'User'}
            </div>
            <div className="truncate text-[10px] text-foreground-subtle">
              {user?.email ?? ''}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] text-foreground-muted hover:bg-surface-2"
          >
            {currentTheme === 'dark' ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] text-foreground-muted hover:bg-surface-2"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border bg-sidebar px-2 py-2 lg:hidden">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 text-[11px] transition-colors',
                isActive ? 'text-foreground' : 'text-foreground-muted'
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isActive ? 'bg-foreground' : 'bg-transparent'
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
