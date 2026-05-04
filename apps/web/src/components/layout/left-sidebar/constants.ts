import {
  FolderGit2,
  Inbox,
  LayoutGrid,
  ListChecks,
  type LucideIcon,
  Settings as SettingsIcon,
} from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutGrid },
  { label: 'Inbox', href: '/inbox', icon: Inbox },
  { label: 'Tasks', href: '/tasks', icon: ListChecks },
  { label: 'Projects', href: '/projects', icon: FolderGit2 },
  { label: 'Settings', href: '/settings', icon: SettingsIcon },
];
