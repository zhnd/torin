import { FolderGit2, Home, Settings } from 'lucide-react';

export interface NavigationItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { icon: Home, label: 'Tasks', href: '/tasks' },
  { icon: FolderGit2, label: 'Projects', href: '/projects' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];
