import { Chip } from '../chip';

const STATUS_META: Record<
  string,
  { label: string; dotClass: string; pulse?: boolean; strong?: boolean }
> = {
  PENDING: { label: 'Queued', dotClass: 'sv-pending' },
  queued: { label: 'Queued', dotClass: 'sv-pending' },
  RUNNING: { label: 'Running', dotClass: 'sv-running', pulse: true },
  running: { label: 'Running', dotClass: 'sv-running', pulse: true },
  AWAITING_REVIEW: {
    label: 'Awaiting review',
    dotClass: 'sv-awaiting',
    pulse: true,
    strong: true,
  },
  awaiting_review: {
    label: 'Awaiting review',
    dotClass: 'sv-awaiting',
    pulse: true,
    strong: true,
  },
  COMPLETED: { label: 'Completed', dotClass: 'sv-done' },
  completed: { label: 'Completed', dotClass: 'sv-done' },
  FAILED: { label: 'Failed', dotClass: 'sv-failed', strong: true },
  failed: { label: 'Failed', dotClass: 'sv-failed', strong: true },
};

export function StatusChip({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.PENDING;
  return (
    <Chip dotClass={meta.dotClass} pulse={meta.pulse} strong={meta.strong}>
      {meta.label}
    </Chip>
  );
}
