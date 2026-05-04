'use client';

import { SectionHead } from '@/components/common/section-head';
import {
  formatDurationMs,
  kindLabel,
  severityColor,
  stageDurations,
} from './libs';
import type { RetrospectiveViewProps } from './types';

/**
 * Post-run retrospective: summary prose + per-stage duration bars +
 * recommendations + risk factors. Stats always render (deterministic);
 * summary + advisory lists are empty when the LLM is disabled, but
 * that's signalled explicitly in the footer rather than hiding the tab.
 */
export function RetrospectiveView({ retrospective }: RetrospectiveViewProps) {
  if (!retrospective) {
    return (
      <div className="rounded-md border border-border bg-surface px-6 py-10 text-center text-[12.5px] text-foreground-muted">
        No retrospective generated yet. It appears after the task reaches a
        terminal state.
      </div>
    );
  }

  const durations = stageDurations(retrospective.stats);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary card */}
      <div className="rounded-md border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-foreground-muted">
            Summary
          </span>
          {retrospective.model ? (
            <span className="font-mono text-[11px] text-foreground-subtle">
              {retrospective.model}
            </span>
          ) : (
            <span className="rounded-sm bg-surface-inset px-1.5 py-0.5 font-mono text-[10.5px] text-foreground-subtle">
              stats only
            </span>
          )}
          <span className="flex-1" />
          {retrospective.costUsd != null && (
            <span className="font-mono text-[11px] text-foreground-subtle">
              ${retrospective.costUsd.toFixed(4)}
            </span>
          )}
        </div>
        <p className="m-0 text-[14px] leading-[1.55] text-foreground">
          {retrospective.summary ?? '—'}
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatBlock
          label="Wall time"
          value={formatDurationMs(retrospective.stats.totalDurationMs)}
        />
        <StatBlock
          label="Total cost"
          value={`$${retrospective.stats.totalCostUsd.toFixed(4)}`}
        />
        <StatBlock
          label="Retries"
          value={String(retrospective.stats.retryCount)}
          hint={
            retrospective.stats.retryCount > 0 ? 'rework cycles' : undefined
          }
        />
        <StatBlock
          label="Reviews"
          value={String(retrospective.stats.reviewCount)}
          hint={
            retrospective.stats.sampleCount > 0
              ? `${retrospective.stats.sampleCount} samples`
              : undefined
          }
        />
      </div>

      {/* Per-stage duration chart */}
      <div>
        <SectionHead title="Stage timings" />
        <div className="rounded-md border border-border bg-surface p-4">
          {durations.length === 0 ? (
            <div className="py-4 text-center text-[11.5px] text-foreground-subtle">
              No stage timings recorded
            </div>
          ) : (
            durations.map((d) => (
              <div
                key={d.stageName}
                className="mb-2 flex items-center gap-3 last:mb-0"
              >
                <span className="w-28 font-mono text-[12px] font-medium">
                  {d.stageName}
                </span>
                <div className="flex-1 overflow-hidden rounded-[2px] bg-surface-inset">
                  <div
                    className="h-2 bg-foreground"
                    style={{ width: `${Math.max(d.percent, 1)}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono text-[11.5px] tabular-nums text-foreground-muted">
                  {formatDurationMs(d.durationMs)}
                </span>
                <span className="w-10 text-right font-mono text-[11px] text-foreground-subtle">
                  {d.percent}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottlenecks */}
      {retrospective.bottlenecks.length > 0 && (
        <div>
          <SectionHead
            title="Bottlenecks"
            subtitle="Stages that took disproportionate time"
          />
          <div className="rounded-md border border-border bg-surface">
            {retrospective.bottlenecks.map((b, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: bottlenecks list is positionally stable per retrospective
                key={`${b.stageName}-${i}`}
                className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <span className="w-28 font-mono text-[12.5px] font-semibold">
                  {b.stageName}
                </span>
                <span className="w-20 shrink-0 font-mono text-[11.5px] text-foreground-muted">
                  {formatDurationMs(b.durationMs)}
                </span>
                <span className="text-[12.5px] text-foreground">
                  {b.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {retrospective.recommendations.length > 0 && (
        <div>
          <SectionHead
            title="Recommendations"
            subtitle="What to try differently next run"
          />
          <div className="rounded-md border border-border bg-surface">
            {retrospective.recommendations.map((r, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: recommendations are positional within a single retrospective
                key={`${r.kind}-${i}`}
                className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <span className="w-28 shrink-0 rounded-sm bg-surface-inset px-1.5 py-0.5 text-center font-mono text-[10.5px] font-medium">
                  {kindLabel(r.kind)}
                </span>
                <span className="text-[12.5px] text-foreground">{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk factors */}
      {retrospective.riskFactors.length > 0 && (
        <div>
          <SectionHead
            title="Risks for next run"
            subtitle="Things that passed here but may not next time"
          />
          <div className="rounded-md border border-border bg-surface">
            {retrospective.riskFactors.map((r, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: risk factors are positional within a single retrospective
                key={`${r.severity}-${i}`}
                className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <span
                  className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: severityColor(r.severity) }}
                />
                <span className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-[0.04em] text-foreground-muted">
                  {r.severity}
                </span>
                <span className="text-[12.5px] text-foreground">{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3.5">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.04em] text-foreground-subtle">
        {label}
      </div>
      <div className="mt-1.5 font-semibold leading-none tabular-nums tracking-normal text-foreground text-[22px]">
        {value}
      </div>
      {hint && (
        <div className="mt-1.25 text-[11.5px] text-foreground-subtle">
          {hint}
        </div>
      )}
    </div>
  );
}
