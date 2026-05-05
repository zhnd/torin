'use client';

import type {
  AgentInvocationView,
  EventInvocationsView,
  ToolCallView,
} from '@/modules/tasks/types';
import { formatDurationMs } from './libs';
import type { TraceViewProps } from './types';
import { useService } from './use-service';

/**
 * Phase 1 trace drill-down. Each TaskEvent (stage attempt) becomes a
 * card; expanding it reveals the AgentInvocation rows for that attempt.
 * Each invocation expands to show per-turn metadata + a per-tool-call
 * table. Clicking a tool call opens a modal with placeholder copy —
 * full input/output bodies arrive in Phase 2 (raw SDK message stream).
 *
 * Hierarchy: TaskEvent → AgentInvocation → AgentTurn / ToolCall.
 *
 * Updates live via the parent task subscription — no local polling.
 */
export function TraceView({ events }: TraceViewProps) {
  const svc = useService();

  if (events.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface px-6 py-10 text-center text-[12.5px] text-foreground-muted">
        No agent invocations recorded yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map((evt) => (
        <EventCard
          key={evt.eventId}
          event={evt}
          expanded={svc.expandedStages[evt.eventId] ?? false}
          onToggle={() => svc.toggleStage(evt.eventId)}
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

function EventCard({
  event,
  expanded,
  onToggle,
  expandedInvocations,
  onToggleInvocation,
  onSelectToolCall,
}: {
  event: EventInvocationsView;
  expanded: boolean;
  onToggle: () => void;
  expandedInvocations: Record<string, boolean>;
  onToggleInvocation: (id: string) => void;
  onSelectToolCall: (tc: ToolCallView, inv: AgentInvocationView) => void;
}) {
  const toolCount = event.invocations.reduce(
    (n, i) => n + i.toolCalls.length,
    0
  );
  const totalCost = event.invocations.reduce(
    (n, i) => n + (i.totalCostUsd ?? 0),
    0
  );

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left hover:bg-surface-2"
      >
        <StatusDot status={event.status} />
        <span className="text-[13px] font-semibold">{event.stageKey}</span>
        <span className="font-mono text-[11px] text-foreground-subtle">
          attempt #{event.attemptNumber}
        </span>
        <span className="font-mono text-[11px] text-foreground-subtle">
          {event.invocations.length} invocation
          {event.invocations.length !== 1 ? 's' : ''}
        </span>
        <span className="font-mono text-[11px] text-foreground-subtle">
          {toolCount} tool call{toolCount !== 1 ? 's' : ''}
        </span>
        <span className="flex-1" />
        {totalCost > 0 && (
          <span className="font-mono text-[11px] text-foreground-muted">
            ${totalCost.toFixed(4)}
          </span>
        )}
        <span className="font-mono text-[11px] text-foreground-muted">
          {formatDurationMs(event.durationMs)}
        </span>
        <span className="text-[11px] text-foreground-subtle">
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-2.5">
          {groupByAgent(event.invocations).map((group) => (
            <AgentGroup
              key={group.agentName}
              group={group}
              showHeader={!isSingleAgentStage(event.invocations)}
              expandedInvocations={expandedInvocations}
              onToggleInvocation={onToggleInvocation}
              onSelectToolCall={onSelectToolCall}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AgentGroupShape {
  agentName: string;
  invocations: AgentInvocationView[];
}

function groupByAgent(invocations: AgentInvocationView[]): AgentGroupShape[] {
  const map = new Map<string, AgentInvocationView[]>();
  for (const inv of invocations) {
    const list = map.get(inv.agentName) ?? [];
    list.push(inv);
    map.set(inv.agentName, list);
  }
  return Array.from(map.entries()).map(([agentName, list]) => ({
    agentName,
    invocations: list,
  }));
}

function isSingleAgentStage(invocations: AgentInvocationView[]): boolean {
  if (invocations.length === 0) return true;
  const first = invocations[0].agentName;
  return invocations.every((inv) => inv.agentName === first);
}

function AgentGroup({
  group,
  showHeader,
  expandedInvocations,
  onToggleInvocation,
  onSelectToolCall,
}: {
  group: AgentGroupShape;
  showHeader: boolean;
  expandedInvocations: Record<string, boolean>;
  onToggleInvocation: (id: string) => void;
  onSelectToolCall: (tc: ToolCallView, inv: AgentInvocationView) => void;
}) {
  const totalCost = group.invocations.reduce(
    (n, i) => n + (i.totalCostUsd ?? 0),
    0
  );
  return (
    <div className="mb-3 last:mb-0">
      {showHeader && (
        <div className="mb-1.5 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-foreground-subtle">
          <span>{group.agentName}</span>
          <span className="font-mono normal-case tracking-normal">
            × {group.invocations.length}
          </span>
          {totalCost > 0 && (
            <span className="font-mono normal-case tracking-normal text-foreground-muted">
              · ${totalCost.toFixed(4)}
            </span>
          )}
        </div>
      )}
      {group.invocations.map((inv) => (
        <InvocationRow
          key={inv.id}
          inv={inv}
          expanded={expandedInvocations[inv.id] ?? false}
          onToggle={() => onToggleInvocation(inv.id)}
          onSelectToolCall={(tc) => onSelectToolCall(tc, inv)}
        />
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
    <div className="mb-2 overflow-hidden rounded-[var(--radius-sm)] border border-border bg-surface-inset last:mb-0">
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
          {inv.errorText && (
            <div className="border-b border-border bg-[color-mix(in_oklch,var(--danger)_8%,transparent)] px-3 py-2 font-mono text-[11px] text-[color:var(--danger)]">
              {inv.errorText}
            </div>
          )}

          <TurnTimeline inv={inv} onSelectToolCall={onSelectToolCall} />
        </div>
      )}
    </div>
  );
}

/**
 * Per-invocation timeline: each turn is a header (with a delta from the
 * invocation start + tool count), followed by the tool calls that fired
 * within that turn, indented. Tool calls without an `agentTurnId`
 * (shouldn't normally occur) are surfaced under an "(unattached)" group
 * at the end so nothing silently disappears.
 */
function TurnTimeline({
  inv,
  onSelectToolCall,
}: {
  inv: AgentInvocationView;
  onSelectToolCall: (tc: ToolCallView) => void;
}) {
  if (inv.turns.length === 0 && inv.toolCalls.length === 0) {
    return (
      <div className="px-3 py-3 text-center font-mono text-[11px] text-foreground-subtle">
        No turns recorded
      </div>
    );
  }

  const invocationStartMs = Date.parse(inv.startedAt);
  const toolsByTurnId = new Map<string, ToolCallView[]>();
  const orphanTools: ToolCallView[] = [];
  for (const tc of inv.toolCalls) {
    if (tc.agentTurnId) {
      const list = toolsByTurnId.get(tc.agentTurnId) ?? [];
      list.push(tc);
      toolsByTurnId.set(tc.agentTurnId, list);
    } else {
      orphanTools.push(tc);
    }
  }

  return (
    <div className="px-3 py-2">
      {inv.turns.map((turn) => {
        const tools = toolsByTurnId.get(turn.id) ?? [];
        const deltaMs = Date.parse(turn.startedAt) - invocationStartMs;
        return (
          <TurnBlock
            key={turn.id}
            turnIndex={turn.turnIndex}
            deltaMs={Number.isFinite(deltaMs) ? deltaMs : null}
            tools={tools}
            onSelectToolCall={onSelectToolCall}
          />
        );
      })}
      {orphanTools.length > 0 && (
        <TurnBlock
          turnIndex={null}
          deltaMs={null}
          tools={orphanTools}
          onSelectToolCall={onSelectToolCall}
          label="(unattached)"
        />
      )}
    </div>
  );
}

function TurnBlock({
  turnIndex,
  deltaMs,
  tools,
  onSelectToolCall,
  label,
}: {
  turnIndex: number | null;
  deltaMs: number | null;
  tools: ToolCallView[];
  onSelectToolCall: (tc: ToolCallView) => void;
  label?: string;
}) {
  const heading = label ?? (turnIndex != null ? `Turn ${turnIndex}` : 'Turn');
  return (
    <div className="mb-1.5 last:mb-0">
      <div className="flex items-center gap-2 font-mono text-[10.5px] text-foreground-subtle">
        <span className="font-semibold uppercase tracking-[0.04em] text-foreground-muted">
          {heading}
        </span>
        {deltaMs != null && deltaMs >= 0 && (
          <span>+{formatDurationMs(deltaMs)}</span>
        )}
        <span>
          ·{' '}
          {tools.length === 0
            ? 'text only'
            : `${tools.length} tool${tools.length !== 1 ? 's' : ''}`}
        </span>
      </div>
      {tools.length > 0 && (
        <table className="mt-1 w-full border-collapse font-mono text-[11px]">
          <tbody>
            {tools.map((tc) => (
              <tr
                key={tc.id}
                onClick={() => onSelectToolCall(tc)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelectToolCall(tc);
                }}
                className="cursor-pointer border-b border-border-faint last:border-b-0 hover:bg-surface-2"
              >
                <td className="w-4 px-2 py-1.25 align-top text-foreground-subtle">
                  └
                </td>
                <td className="w-32 px-2 py-1.25 align-top font-semibold">
                  {tc.name}
                </td>
                <td className="px-2 py-1.25 align-top text-foreground-subtle">
                  {tc.toolUseId.slice(0, 12)}…
                </td>
                <td className="w-16 px-2 py-1.25 text-right align-top text-foreground-subtle">
                  {formatDurationMs(tc.durationMs)}
                </td>
                <td className="w-6 px-2 py-1.25 text-center align-top">
                  {tc.success === true ? '✓' : tc.success === false ? '✕' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      {/* biome-ignore lint/a11y/noStaticElementInteractions: propagation-trap wrapper — stops backdrop close when interacting with modal content; not itself interactive */}
      <div
        className="flex max-h-[85vh] w-full max-w-170 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="font-mono text-[13px] font-semibold">{tc.name}</span>
          {tc.success === true && (
            <span className="rounded-sm bg-[color-mix(in_oklch,var(--ok)_15%,transparent)] px-1.5 py-0.5 font-mono text-[10.5px] text-ok">
              success
            </span>
          )}
          {tc.success === false && (
            <span className="rounded-sm bg-[color-mix(in_oklch,var(--danger)_15%,transparent)] px-1.5 py-0.5 font-mono text-[10.5px] text-danger">
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
            className="cursor-pointer rounded-(--radius-sm) border border-border bg-surface px-2 py-1 font-mono text-[11px] hover:bg-surface-2"
          >
            Close
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          <div className="rounded-(--radius-sm) border border-border-faint bg-surface-inset px-3 py-2.5 font-mono text-[11.5px] text-foreground-muted">
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-foreground-subtle">
              tool_use_id
            </div>
            {tc.toolUseId}
          </div>

          <div className="rounded-(--radius-sm) border border-dashed border-border bg-surface px-3 py-3 text-[12px] text-foreground-muted">
            <div className="mb-1 font-semibold text-foreground">
              Tool input / output capture coming next phase
            </div>
            <p className="m-0 leading-[1.55] text-foreground-subtle">
              Phase 1 records tool-call metadata only (name, duration, success).
              Full request arguments and result bodies arrive in Phase 2 with
              the raw SDK message stream.
            </p>
          </div>
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
