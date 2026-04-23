import { Chip } from '../chip';

const SEVERITY_META: Record<string, { label: string; dotColor: string }> = {
  blocking: { label: 'Blocking', dotColor: 'var(--danger)' },
  warning: { label: 'Warning', dotColor: 'var(--warn)' },
  info: { label: 'Info', dotColor: 'var(--foreground-subtle)' },
};

export function SeverityChip({ severity }: { severity: string }) {
  const meta = SEVERITY_META[severity] ?? SEVERITY_META.info;
  return (
    <Chip dot={meta.dotColor} strong>
      {meta.label}
    </Chip>
  );
}
