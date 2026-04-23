'use client';

import type {
  AgentInvocationView,
  StageView,
  ToolCallView,
} from '@/modules/tasks/types';
import { cn } from '@/utils/cn';
import {
  formatBytes,
  formatDurationMs,
  formatInputJson,
  summarizeInput,
  summarizeOutput,
} from './libs';
import type { TraceViewProps } from './types';
import { useService } from './use-service';

/**
 * Runtime trace drill-down: WorkflowExecution → StageExecution →
 * AttemptExecution → AgentInvocation → AgentTurn/ToolCall. Tool calls
 * open a modal with the full input JSON + raw output (up to 32 KB,
 * truncation marker shown when applicable).
 *
 * Updates live via the parent task subscription — no local polling.
 */
export function TraceView({ execution }: TraceViewProps) {
  const svc = useService();

  if (!execution) {
    return (
      <div className="rounded-md border border-border bg-surface px-6 py-10 text-center text-[12.5px] text-foreground-muted">
        No execution recorded for this task yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {execution.stages.map((stage) => (
        <StageCard
          key={stage.id}
          stage={stage}
          expanded={svc.expandedStages[stage.id] ?? false}
          onToggle={() => svc.toggleStage(stage.id)}
          expandedInvocations={svc.expandedInvocations}
          onToggleInvocation={svc.toggleInvocation}
          onSelectToolCall={(tc, inv) =>
            svc.setSelectedToolCall({ toolCall: tc, invocation: inv })
          }
        />
      ))}

      {svc.selectedToolCall && (
        <ToolCallModal
          tc={svc.selectedToolCall.toolCall}
          onClose={() => svc.setSelectedToolCall(null)}
        />
      )}
    </div>
  );
}

function StageCard({
  stage,
  expanded,
  onToggle,
  expandedInvocations,
  onToggleInvocation,
  onSelectToolCall,
}: {
  stage: StageView;
  expanded: boolean;
  onToggle: () => void;
  expandedInvocations: Record<string, boolean>;
  onToggleInvocation: (id: string) => void;
  onSelectToolCall: (tc: ToolCallView, inv: AgentInvocationView) => void;
}) {
  const toolCount = stage.attempts.reduce(
    (n, a) => n + a.invocations.reduce((s, i) => s + i.toolCalls.length, 0),
    0
  );
  const invocCount = stage.attempts.reduce(
    (n, a) => n + a.invocations.length,
    0
  );

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left hover:bg-surface-2"
      >
        <StatusDot status={stage.status} />
        <span className="text-[13px] font-semibold">{stage.stageName}</span>
        <span className="font-mono text-[11px] text-foreground-subtle">
          attempt{stage.attempts.length !== 1 ? 's' : ''} ×{stage.attempts.length}
        </span>
        <span className="font-mono text-[11px] text-foreground-subtle">
          {invocCount} invocation{invocCount !== 1 ? 's' : ''}
        </span>
        <span className="font-mono text-[11px] text-foreground-subtle">
          {toolCount} tool call{toolCount !== 1 ? 's' : ''}
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[11px] text-foreground-muted">
          {formatDurationMs(stage.durationMs)}
        </span>
        <span className="text-[11px] text-foreground-subtle">
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      {expanded &&
        stage.attempts.map((attempt) => (
          <div key={attempt.id} className="border-t border-border px-4 py-2.5">
            <div className="mb-2 flex items-center gap-2 text-[11.5px]">
              <span className="font-mono font-semibold">
                attempt #{attempt.attemptNumber}
              </span>
              <span className="rounded-sm bg-surface-inset px-1.5 py-0.5 font-mono text-[10.5px] text-foreground-muted">
                {attempt.triggerKind}
              </span>
              <StatusDot status={attempt.status} />
              <span className="flex-1" />
              <span className="font-mono text-foreground-subtle">
                {formatDurationMs(attempt.durationMs)}
              </span>
            </div>

            {attempt.invocations.length === 0 ? (
              <div className="py-2 text-center text-[11.5px] text-foreground-subtle">
                No agent invocations recorded
              </div>
            ) : (
              attempt.invocations.map((inv) => (
                <InvocationRow
                  key={inv.id}
                  inv={inv}
                  expanded={expandedInvocations[inv.id] ?? false}
                  onToggle={() => onToggleInvocation(inv.id)}
                  onSelectToolCall={(tc) => onSelectToolCall(tc, inv)}
                />
              ))
            )}
          </div>
        ))}
    </div>
  );
}

function InvocationRow({
  inv,
  expanded,
  onToggle,
  onSelectToolCall,
}: {
  inv: AgentInvocationView;
  expanded: boolean;
  onToggle: () => void;
  onSelectToolCall: (tc: ToolCallView) => void;
}) {
  return (
    <div className="mb-2 overflow-hidden rounded-[var(--radius-sm)] border border-border bg-surface-inset">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3 py-2 text-left hover:bg-surface-2"
      >
        <span className="font-mono text-[11.5px] font-semibold">
          {inv.agentName}
        </span>
        <StatusDot status={inv.status} />
        <span className="font-mono text-[10.5px] text-foreground-subtle">
          {inv.model}
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[10.5px] text-foreground-muted">
          {inv.turns.length} turn{inv.turns.length !== 1 ? 's' : ''}
        </span>
        <span className="font-mono text-[10.5px] text-foreground-muted">
          {inv.toolCalls.length} tool
        </span>
        <span className="font-mono text-[10.5px] text-foreground-muted">
          {formatDurationMs(inv.durationMs)}
        </span>
        {inv.totalCostUsd != null && (
          <span className="font-mono text-[10.5px] text-foreground-muted">
            ${inv.totalCostUsd.toFixed(4)}
          </span>
        )}
        <span className="text-[11px] text-foreground-subtle">
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {inv.turns.length > 0 && (
            <div className="border-b border-border px-3 py-2">
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-foreground-subtle">
                Turns
              </div>
              {inv.turns.map((turn) => (
                <div
                  key={turn.id}
                  className="mb-1.5 flex items-start gap-2 last:mb-0"
                >
                  <span className="w-6 shrink-0 font-mono text-[10.5px] text-foreground-subtle">
                    #{turn.turnIndex}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10.5px] text-foreground-subtle">
                      <span>{turn.role}</span>
                      {turn.toolUseCount > 0 && (
                        <span>· {turn.toolUseCount} tool_use</span>
                      )}
                      {turn.inputTokens != null && (
                        <span>· in {turn.inputTokens}</span>
                      )}
                      {turn.outputTokens != null && (
                        <span>· out {turn.outputTokens}</span>
                      )}
                    </div>
                    {turn.textContent && (
                      <div className="mt-0.5 whitespace-pre-wrap font-mono text-[11px] leading-[1.5] text-foreground">
                        {turn.textContent}
                        {turn.textTruncatedAt != null && (
                          <span className="text-foreground-subtle">
                            {' '}
                            … [truncated from {formatBytes(turn.textTruncatedAt)}]
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {inv.toolCalls.length > 0 && (
            <div className="px-3 py-2">
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-foreground-subtle">
                Tool calls
              </div>
              <table className="w-full border-collapse font-mono text-[11px]">
                <tbody>
                  {inv.toolCalls.map((tc) => (
                    <tr
                      key={tc.id}
                      onClick={() => onSelectToolCall(tc)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSelectToolCall(tc);
                      }}
                      className="cursor-pointer border-b border-border last:border-b-0 hover:bg-surface-2"
                    >
                      <td className="w-24 px-2 py-1.5 align-top font-semibold">
                        {tc.name}
                      </td>
                      <td className="max-w-0 truncate px-2 py-1.5 align-top text-foreground-muted">
                        {summarizeInput(tc.input)}
                      </td>
                      <td className="max-w-0 truncate px-2 py-1.5 align-top text-foreground-subtle">
                        {summarizeOutput(tc)}
                      </td>
                      <td className="w-12 px-2 py-1.5 text-right align-top text-foreground-subtle">
                        {formatDurationMs(tc.durationMs)}
                      </td>
                      <td className="w-6 px-2 py-1.5 text-center align-top">
                        {tc.success === true
                          ? '✓'
                          : tc.success === false
                            ? '✕'
                            : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolCallModal({
  tc,
  onClose,
}: {
  tc: ToolCallView;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-[900px] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="font-mono text-[13px] font-semibold">{tc.name}</span>
          {tc.success === true && (
            <span className="rounded-sm bg-[color-mix(in_oklch,var(--ok)_15%,transparent)] px-1.5 py-0.5 font-mono text-[10.5px] text-[color:var(--ok)]">
              success
            </span>
          )}
          {tc.success === false && (
            <span className="rounded-sm bg-[color-mix(in_oklch,var(--danger)_15%,transparent)] px-1.5 py-0.5 font-mono text-[10.5px] text-[color:var(--danger)]">
              error
            </span>
          )}
          <span className="font-mono text-[11px] text-foreground-subtle">
            {formatDurationMs(tc.durationMs)}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-1 font-mono text-[11px] hover:bg-surface-2"
          >
            Close
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <section>
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-foreground-subtle">
              Input
            </div>
            <pre className="m-0 overflow-auto rounded-[var(--radius-sm)] border border-border bg-surface-inset p-3 font-mono text-[11.5px] leading-[1.55]">
              {formatInputJson(tc.input)}
            </pre>
          </section>

          <section>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.04em] text-foreground-subtle">
                Output
              </span>
              {tc.outputTruncatedAt != null && (
                <span
                  className={cn(
                    'rounded-sm px-1.5 py-0.5 font-mono text-[10.5px]',
                    'bg-[color-mix(in_oklch,var(--warn)_15%,transparent)]',
                    'text-[color:var(--warn)]'
                  )}
                >
                  truncated from {formatBytes(tc.outputTruncatedAt)}
                </span>
              )}
            </div>
            <pre className="m-0 max-h-125 overflow-auto rounded-[var(--radius-sm)] border border-border bg-surface-inset p-3 font-mono text-[11.5px] leading-[1.55]">
              {tc.output ?? tc.errorText ?? '—'}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const v = status.toLowerCase();
  const color =
    v === 'completed' || v === 'success'
      ? 'var(--ok)'
      : v === 'failed' || v === 'error'
        ? 'var(--danger)'
        : v === 'running'
          ? 'var(--accent)'
          : v === 'awaiting'
            ? 'var(--warn)'
            : 'var(--foreground-subtle)';
  return (
    <span
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}
