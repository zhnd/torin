import { StageTag } from '@/components/common/stage-tag';
import { STAGE_LABELS } from '../../constants';
import type { StageKey } from '../../types';

/**
 * Empty-state message for stages that haven't run yet (`pending`) or
 * were skipped because an earlier stage failed (`skipped`).
 */
export function StagePlaceholder({
  stage,
  reason,
}: {
  stage: StageKey;
  reason: 'pending' | 'skipped';
}) {
  return (
    <div className="py-10 text-center text-foreground-subtle">
      <div className="text-[13px]">
        {STAGE_LABELS[stage]}{' '}
        {reason === 'pending'
          ? "hasn't started yet."
          : 'was skipped because an earlier stage failed.'}
      </div>
    </div>
  );
}

/**
 * Stage-body header: stage tag eyebrow + heading + optional chip row.
 * Used by every stage body for visual consistency.
 */
export function StageHeader({
  title,
  stage,
  chips,
}: {
  title: string;
  stage: StageKey;
  chips?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-foreground-subtle">
        <span className="inline-block h-1 w-1 rounded-full bg-foreground-faint" />
        <StageTag stage={stage} />
      </div>
      <h2 className="m-0 text-[20px] font-semibold leading-[1.15] tracking-normal text-foreground">
        {title}
      </h2>
      {chips && <div className="mt-2.5 flex flex-wrap gap-3.5">{chips}</div>}
    </div>
  );
}

/**
 * Labeled section block within a stage body. Mono uppercase eyebrow +
 * children container with bottom margin.
 */
export function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-foreground-subtle">
        {label}
      </div>
      {children}
    </div>
  );
}
