'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Top header bar — theme toggle on the right. Search/command palette
 * is intentionally omitted until it's wired to a real backend; pages
 * own their own filtering UI.
 */
export function AppHeader() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = mounted ? (theme === 'system' ? resolvedTheme : theme) : null;
  const next = current === 'dark' ? 'light' : 'dark';

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-5">
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => setTheme(next)}
        title="Toggle theme"
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border-none bg-transparent text-foreground transition-colors hover:bg-surface-2"
      >
        {current === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
    </header>
  );
}
