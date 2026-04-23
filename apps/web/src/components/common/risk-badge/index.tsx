import { Chip } from '../chip';

const RISK_META: Record<string, { label: string; dotColor: string }> = {
  trivial: { label: 'trivial', dotColor: 'var(--foreground-subtle)' },
  low: { label: 'low', dotColor: 'var(--ok)' },
  medium: { label: 'medium', dotColor: 'var(--warn)' },
  high: { label: 'high', dotColor: 'var(--accent)' },
  critical: { label: 'critical', dotColor: 'var(--danger)' },
};

export function RiskBadge({ risk }: { risk: string }) {
  const meta = RISK_META[risk] ?? RISK_META.low;
  return <Chip dot={meta.dotColor}>Risk · {meta.label}</Chip>;
}
