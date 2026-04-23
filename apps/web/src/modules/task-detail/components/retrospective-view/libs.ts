import type { RetrospectiveView } from '@/modules/tasks/types';

export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}

export function stageDurations(
  stats: RetrospectiveView['stats']
): Array<{ stageName: string; durationMs: number; percent: number }> {
  const entries = Object.entries(stats.perStage);
  const total = entries.reduce((s, [, v]) => s + v.durationMs, 0);
  return entries
    .map(([stageName, s]) => ({
      stageName,
      durationMs: s.durationMs,
      percent: total > 0 ? Math.round((s.durationMs / total) * 100) : 0,
    }))
    .sort((a, b) => b.durationMs - a.durationMs);
}

export function severityColor(severity: string): string {
  if (severity === 'critical') return 'var(--danger)';
  if (severity === 'warning') return 'var(--warn)';
  return 'var(--foreground-subtle)';
}

export function kindLabel(kind: string): string {
  if (kind === 'performance') return 'Performance';
  if (kind === 'reliability') return 'Reliability';
  if (kind === 'quality') return 'Quality';
  if (kind === 'process') return 'Process';
  return kind;
}
