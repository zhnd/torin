import { RECENT_TASKS_LIMIT } from './constants';
import type { ProjectTask } from './types';

export function authLabel(method: string): string {
  if (method === 'NONE') return 'None';
  if (method === 'GITHUB_APP') return 'GitHub App';
  if (method === 'TOKEN') return 'Personal token';
  return method;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function byCreatedDesc(a: ProjectTask, b: ProjectTask): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function sortTasksRecent(tasks: ProjectTask[]): ProjectTask[] {
  return [...tasks].sort(byCreatedDesc);
}

export function pickRecentTasks(tasks: ProjectTask[]): ProjectTask[] {
  return sortTasksRecent(tasks).slice(0, RECENT_TASKS_LIMIT);
}
