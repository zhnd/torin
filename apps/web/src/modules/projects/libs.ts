import { REPO_LANG_HINTS } from './constants';

export function repoLang(url: string): string {
  for (const [pattern, lang] of REPO_LANG_HINTS) {
    if (pattern.test(url)) return lang;
  }
  return '—';
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
