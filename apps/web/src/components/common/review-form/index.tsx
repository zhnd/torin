'use client';

import { Dot } from '@/components/common/dot';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/cn';
import { LANES } from './constants';
import type {
  Lane,
  LaneMeta,
  ReviewFormVariant,
  ReviewSubmitPayload,
} from './types';
import { useService } from './use-service';

interface ReviewFormProps {
  variant?: ReviewFormVariant;
  onSubmit?: (payload: ReviewSubmitPayload) => void;
  disabled?: boolean;
}

export function ReviewForm({
  variant = 'hitl',
  onSubmit,
  disabled,
}: ReviewFormProps) {
  const {
    lane,
    setLane,
    feedback,
    setFeedback,
    curLane,
    feedbackLen,
    canSubmit,
    discard,
    submit,
  } = useService({ onSubmit });

  const isAnalyze = variant === 'analyze';

  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="mb-3.5 flex items-center gap-2">
        <Dot color="var(--accent)" size={6} pulse />
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[color:var(--accent-ink)]">
          Your decision
        </span>
      </div>

      <div className={cn('grid grid-cols-3 gap-1.5', lane ? 'mb-3.5' : '')}>
        {(Object.entries(LANES) as Array<[Lane, LaneMeta]>).map(([key, l]) => {
          const selected = lane === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setLane(key)}
              className={cn(
                'flex cursor-pointer flex-col gap-1 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left transition-all',
                selected
                  ? 'border-foreground bg-surface-2'
                  : 'border-border bg-surface hover:border-border-strong'
              )}
            >
              <div className="flex items-center gap-1.5">
                <Dot color={l.dot} size={6} />
                <span className="flex-1 text-[12.5px] font-semibold">
                  {l.label}
                </span>
                <kbd className="rounded-sm border border-border bg-surface px-1 py-px font-mono text-[10px] text-foreground-muted">
                  {l.keyHint}
                </kbd>
              </div>
              <div className="ml-3.25 text-[11px] leading-[1.4] text-foreground-muted">
                {isAnalyze ? l.descAnalyze : l.desc}
              </div>
            </button>
          );
        })}
      </div>

      {lane && curLane && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <label
              htmlFor="review-feedback"
              className="text-[11px] font-semibold uppercase tracking-[0.04em] text-foreground-subtle"
            >
              {curLane.required ? 'Feedback' : 'Note'}
            </label>
            <span
              className={cn(
                'rounded-sm px-1.5 py-px text-[10.5px] font-medium',
                curLane.required
                  ? 'bg-[color-mix(in_oklch,var(--danger)_10%,transparent)] text-[color:var(--danger)]'
                  : 'text-foreground-subtle'
              )}
            >
              {curLane.required ? 'Required' : 'Optional'}
            </span>
            <span className="flex-1" />
            {curLane.required && curLane.minChars && (
              <span
                className={cn(
                  'font-mono text-[10.5px]',
                  canSubmit
                    ? 'text-[color:var(--ok)]'
                    : 'text-foreground-subtle'
                )}
              >
                {feedbackLen}/{curLane.minChars}
              </span>
            )}
          </div>

          <Textarea
            id="review-feedback"
            rows={3}
            placeholder={curLane.placeholder}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="mb-2.5 resize-y"
          />

          <div className="flex items-center gap-2.5">
            <span className="flex-1 text-[11px] text-foreground-subtle">
              <kbd className="rounded-sm border border-border bg-surface px-1 py-px font-mono text-[10px]">
                ⌘
              </kbd>
              <kbd className="ml-1 rounded-sm border border-border bg-surface px-1 py-px font-mono text-[10px]">
                ↵
              </kbd>{' '}
              to submit
            </span>
            <Button size="sm" variant="outline" onClick={discard}>
              Discard
            </Button>
            <Button
              size="sm"
              disabled={!canSubmit || disabled}
              onClick={submit}
            >
              {isAnalyze ? curLane.ctaAnalyze : curLane.cta}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
