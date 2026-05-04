import type { ToolCallView } from '@/modules/tasks/types';

export function formatDurationMs(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
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
