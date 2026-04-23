export interface NavigationItem {
  label: string;
  href: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Projects', href: '/projects' },
  { label: 'Settings', href: '/settings' },
];
