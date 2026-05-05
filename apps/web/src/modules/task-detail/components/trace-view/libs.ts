import type { ToolCallView } from '@/modules/tasks/types';

export function formatDurationMs(ms: number | null): string {
  if (ms == null) return '—';
  const total = Math.round(ms);
  if (total < 1000) return `${total}ms`;
  const totalSeconds = Math.round(total / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(1)}MB`;
}

export function summarizeInput(input: unknown): string {
  if (input == null) return '';
  if (typeof input === 'string') return input.slice(0, 160);
  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (typeof obj.command === 'string') return obj.command.slice(0, 160);
    if (typeof obj.path === 'string') return obj.path;
    if (typeof obj.file === 'string') return obj.file;
    try {
      return JSON.stringify(obj).slice(0, 160);
    } catch {
      return '[unserializable]';
    }
  }
  return String(input);
}

export function summarizeOutput(tc: ToolCallView): string {
  if (tc.errorText) return tc.errorText.slice(0, 160);
  if (tc.output)
    return tc.output.split('\n').slice(0, 1)[0]?.slice(0, 160) ?? '';
  return '';
}

export function formatInputJson(input: unknown): string {
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}
