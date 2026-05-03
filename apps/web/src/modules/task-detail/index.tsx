'use client';

import { useState } from 'react';
import { CheckTable } from '@/components/common/check-table';
import { Chip } from '@/components/common/chip';
import { ConcernCard } from '@/components/common/concern-card';
import { Dot } from '@/components/common/dot';
import { Markdown } from '@/components/common/markdown';
import { ReviewForm } from '@/components/common/review-form';
import { RiskBadge } from '@/components/common/risk-badge';
import { SampleRow } from '@/components/common/sample-row';
import { StageTag } from '@/components/common/stage-tag';
import {
  DEFAULT_STAGES,
  type StageStatus,
  StageTrack,
} from '@/components/common/stage-track';
import { StatusChip } from '@/components/common/status-chip';
import { AppShell } from '@/components/layout/app-shell';
import { cn } from '@/utils/cn';
import { DiffView } from './components/diff-view';
import { RetrospectiveView } from './components/retrospective-view';
import { TraceView } from './components/trace-view';
import { VisualView } from './components/visual-view';
import { DETAIL_TABS, STAGE_LABELS } from './constants';
import { combineDiffPatches, formatTokens } from './libs';
import type {
  DetailTab,
  ReviewView,
  StageDataMap,
  StageKey,
  TaskDetail,
  TimelineEvent,
} from './types';
import { useService } from './use-service';

interface TaskDetailProps {
  taskId: string;
}

// biome-ignore lint/suspicious/noRedeclare: function and same-named type alias from `./types` are in different namespaces
export function TaskDetail({ taskId }: TaskDetailProps) {
  const {
    loading,
    detail,
    stages,
    stageData,
    selectedStage,
    setSelectedStage,
    tab,
    setTab,
    timings,
    hitlWaited,
    submitReview,
    reviewing,
  } = useService({ taskId });

  if (loading && !detail) {
    return (
      <AppShell scroll={false}>
        <div className="py-10 text-center text-[12px] text-foreground-subtle">
          Loading…
        </div>
      </AppShell>
    );
  }
  if (!detail) {
    return (
      <AppShell scroll={false}>
        <div className="py-10 text-center text-[12.5px] text-foreground-muted">
          Task not found
        </div>
      </AppShell>
    );
  }

  const latestEvent = detail.timeline[detail.timeline.length - 1];

  return (
    <AppShell scroll={false}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border px-7 pt-4">
          <div className="mb-1.5 flex items-center gap-2.5">
            <a
              href="/tasks"
              className="text-[13px] text-foreground-muted no-underline"
            >
              Tasks
            </a>
            <span className="text-foreground-subtle">/</span>
            <span className="font-mono text-[12.5px] text-foreground-subtle">
              {taskId}
            </span>
            <span className="text-foreground-subtle">·</span>
            <StatusChip status={detail.task.status.toUpperCase()} />
          </div>
          <div className="flex items-start justify-between gap-5 pb-3">
            <div className="min-w-0 flex-1">
              <h1 className="m-0 text-[19px] font-semibold tracking-[-0.015em]">
                {detail.summary.description || detail.task.title}
              </h1>
              <div className="mt-1.5 flex flex-wrap gap-3 font-mono text-[11.5px] text-foreground-subtle">
                {detail.task.projectName && (
                  <span>{detail.task.projectName}</span>
                )}
                {detail.task.repo && <span>{detail.task.repo}</span>}
                {detail.task.model && <span>{detail.task.model}</span>}
              </div>
            </div>
            <div className="flex items-start gap-5">
              <Stat label="Duration" value={detail.task.duration} />
              <Stat label="Cost" value={detail.task.cost} />
              <Stat
                label="Tokens"
                value={formatTokens(detail.summary.totalTokens)}
              />
              <OverflowMenu />
            </div>
          </div>
          <DetailTabsBar tab={tab} onChange={setTab} />
        </div>

        {/* Body */}
        {tab === 'overview' && (
          <div className="grid min-h-0 flex-1 grid-cols-[232px_1fr] overflow-hidden">
            <div className="overflow-y-auto border-r border-border p-3">
              <div className="px-2.5 pb-3 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-foreground-subtle">
                Pipeline
              </div>
              <StageTrack
                stages={stages as Partial<Record<string, StageStatus>>}
                currentStage={selectedStage}
                onSelect={(k) => setSelectedStage(k as StageKey)}
                list={DEFAULT_STAGES}
                timings={timings}
              />
            </div>

            <div className="overflow-y-auto px-10 py-6">
              <div className="mx-auto max-w-240 pb-12">
                <StageBody
                  stage={selectedStage}
                  status={stages[selectedStage]}
                  stageData={stageData}
                  detail={detail}
                  onReview={submitReview}
                  reviewing={reviewing}
                  hitlWaited={hitlWaited}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'visual' && (
          <div className="min-h-0 flex-1 overflow-y-auto px-10 py-6">
            <div className="mx-auto max-w-300">
              <VisualView detail={detail} />
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div className="min-h-0 flex-1 overflow-y-auto px-10 py-6">
            <div className="mx-auto max-w-240">
              <EventsView events={detail.timeline} />
            </div>
          </div>
        )}

        {tab === 'trace' && (
          <div className="min-h-0 flex-1 overflow-y-auto px-10 py-6">
            <div className="mx-auto max-w-300">
              <TraceView execution={detail.currentExecution} />
            </div>
          </div>
        )}

        {tab === 'retrospective' && (
          <div className="min-h-0 flex-1 overflow-y-auto px-10 py-6">
            <div className="mx-auto max-w-240">
              <RetrospectiveView
                retrospective={detail.currentExecution?.retrospective ?? null}
              />
            </div>
          </div>
        )}

        <ActivityBar
          count={detail.timeline.length}
          latest={latestEvent}
          live={
            detail.task.status === 'running' ||
            detail.task.status === 'needs_review'
          }
          onShowAll={() => setTab('events')}
        />
      </div>
    </AppShell>
  );
}

// ── Tab strip ────────────────────────────────────────────────────────

function DetailTabsBar({
  tab,
  onChange,
}: {
  tab: DetailTab;
  onChange: (t: DetailTab) => void;
}) {
  return (
    <div className="-mb-px flex gap-0.5">
      {DETAIL_TABS.map(([k, l]) => {
        const active = tab === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={cn(
              '-mb-px cursor-pointer border-none bg-transparent px-3.5 py-2.5 text-[13px] transition-colors',
              active
                ? 'border-b-2 border-foreground font-semibold text-foreground'
                : 'border-b-2 border-transparent font-medium text-foreground-muted hover:text-foreground'
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

// ── Stage body switch ────────────────────────────────────────────────

interface StageBodyProps {
  stage: StageKey;
  status: StageStatus;
  stageData: StageDataMap;
  detail: TaskDetail;
  onReview: (lane: string, feedback: string) => void;
  reviewing: boolean;
  hitlWaited: string | null;
}

function latestOutput(stageData: StageDataMap, key: StageKey): unknown {
  return stageData[key].attempts.at(-1)?.output ?? null;
}

function StageBody(p: StageBodyProps): React.ReactNode {
  if (p.status === 'pending')
    return <StagePlaceholder stage={p.stage} reason="pending" />;
  if (p.status === 'skipped')
    return <StagePlaceholder stage={p.stage} reason="skipped" />;

  switch (p.stage) {
    case 'analyze':
      return (
        <AnalyzeBody
          analysis={latestOutput(p.stageData, 'analyze')}
          status={p.status}
          onReview={p.onReview}
          reviewing={p.reviewing}
        />
      );
    case 'reproduce':
      return <ReproduceBody oracle={latestOutput(p.stageData, 'reproduce')} />;
    case 'implement':
      return (
        <ImplementBody
          payload={
            (latestOutput(p.stageData, 'implement') ?? {}) as Record<
              string,
              unknown
            >
          }
        />
      );
    case 'filter':
      return (
        <FilterBody
          payload={
            (latestOutput(p.stageData, 'filter') ?? {}) as Record<
              string,
              unknown
            >
          }
        />
      );
    case 'critic':
      return (
        <CriticBody
          payload={
            (latestOutput(p.stageData, 'critic') ?? {}) as Record<
              string,
              unknown
            >
          }
        />
      );
    case 'hitl': {
      // HITL gate sits on the CRITIC stage's data (workflow puts the
      // AWAITING + output payload there). Review history is each
      // critic attempt's embedded review (drop attempts without one,
      // e.g. trivial auto-approve).
      const criticAttempts = p.stageData.critic.attempts;
      const history = criticAttempts
        .filter((a) => a.review != null)
        .map((a) => ({
          attemptNumber: a.attemptNumber,
          ...(a.review as NonNullable<typeof a.review>),
        }));
      return (
        <HitlBody
          payload={
            (latestOutput(p.stageData, 'critic') ?? {}) as Record<
              string,
              unknown
            >
          }
          status={p.status}
          onReview={p.onReview}
          reviewing={p.reviewing}
          waited={p.hitlWaited}
          history={history}
        />
      );
    }
    case 'pr':
      return <PrBody pr={latestOutput(p.stageData, 'pr')} detail={p.detail} />;
  }
}

function StagePlaceholder({
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

function StageHeader({
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
      <div className="mb-0.5">
        <StageTag stage={stage} />
      </div>
      <h2 className="m-0 text-[17px] font-semibold tracking-[-0.015em]">
        {title}
      </h2>
      {chips && <div className="mt-2 flex flex-wrap gap-3.5">{chips}</div>}
    </div>
  );
}

function Section({
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

// ── Stage bodies ─────────────────────────────────────────────────────

function AnalyzeBody({
  analysis,
  status,
  onReview,
  reviewing,
}: {
  analysis: unknown;
  status: StageStatus;
  onReview: (lane: string, feedback: string) => void;
  reviewing: boolean;
}) {
  const a = (analysis ?? {}) as Record<string, unknown>;
  const rootCause = String(a.rootCause ?? '');
  const affected = Array.isArray(a.affectedFiles)
    ? (a.affectedFiles as string[])
    : [];
  const approach = String(a.proposedApproach ?? '');
  const risk = String(a.riskClass ?? 'medium');
  const scope = Array.isArray(a.scopeDeclaration) ? 'in-scope' : 'tbd';
  const confidence = String(a.confidence ?? 'medium');
  const isAwaiting = status === 'awaiting';

  return (
    <div>
      <StageHeader
        title="Root cause analysis"
        stage="analyze"
        chips={[
          <RiskBadge key="r" risk={risk} />,
          <Chip key="s" dot="var(--ok)">
            Scope · {scope}
          </Chip>,
          <Chip key="c" mono>
            Confidence · {confidence}
          </Chip>,
        ]}
      />
      {rootCause && (
        <Section label="Root cause">
          <Markdown>{rootCause}</Markdown>
        </Section>
      )}
      {affected.length > 0 && (
        <Section label="Affected files">
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {affected.map((f) => (
              <li
                key={f}
                className="rounded-sm border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-[12px] text-foreground-muted"
              >
                {f}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {approach && (
        <Section label="Proposed approach">
          <Markdown className="text-[13.5px]">{approach}</Markdown>
        </Section>
      )}
      {isAwaiting && (
        <Section label="Your decision">
          <ReviewForm
            variant="analyze"
            onSubmit={({ lane, feedback }) => onReview(lane, feedback)}
            disabled={reviewing}
          />
        </Section>
      )}
    </div>
  );
}

function ReproduceBody({ oracle }: { oracle: unknown }) {
  const r = (oracle ?? {}) as Record<string, unknown>;
  const code = String(r.content ?? r.code ?? '');
  const confirmed = Boolean(r.confirmedFailing ?? r.confirmed);
  const mode = String(r.mode ?? 'verify-script');
  const confirmedMessage = String(r.confirmedMessage ?? '');
  const runtime = String(r.runtime ?? '');

  return (
    <div>
      <StageHeader
        title="Reproduction"
        stage="reproduce"
        chips={
          [
            confirmed ? (
              <Chip key="c" dot="var(--danger)">
                Failing on HEAD
              </Chip>
            ) : (
              <Chip key="c" dot="var(--foreground-subtle)">
                Not confirmed
              </Chip>
            ),
            <Chip key="m" mono>
              Mode · {mode}
            </Chip>,
            runtime ? (
              <Chip key="t" mono>
                {runtime}
              </Chip>
            ) : null,
          ].filter(Boolean) as React.ReactNode[]
        }
      />
      {code ? (
        <Section label="Generated test">
          <pre className="m-0 overflow-auto rounded-md border border-border bg-surface-inset p-3 font-mono text-[12px] leading-[1.55]">
            {code}
          </pre>
        </Section>
      ) : null}
      {confirmedMessage ? (
        <Section label="Confirmation">
          <div className="rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3 py-2.5 font-mono text-[11.5px] text-foreground-muted">
            {confirmedMessage}
          </div>
        </Section>
      ) : null}
      {!code && !confirmedMessage && (
        <div className="text-[12.5px] text-foreground-muted">
          No reproduction artifact recorded.
        </div>
      )}
    </div>
  );
}

function ImplementBody({ payload }: { payload: Record<string, unknown> }) {
  const resolution = (payload.resolution ?? {}) as Record<string, unknown>;
  const samples = Array.isArray(resolution.samples)
    ? (resolution.samples as Array<{
        id: string;
        status: string;
        note?: string;
        time?: string;
      }>)
    : [];
  const diff = Array.isArray(resolution.diff)
    ? (resolution.diff as Array<{
        file: string;
        patch: string;
        additions?: number;
        deletions?: number;
      }>)
    : Array.isArray(payload.diff)
      ? (payload.diff as Array<{
          file: string;
          patch: string;
          additions?: number;
          deletions?: number;
        }>)
      : [];
  const [selected, setSelected] = useState<string | null>(
    samples.find((s) => s.status === 'selected')?.id ?? samples[0]?.id ?? null
  );

  const selectedCount = samples.filter((s) => s.status === 'selected').length;
  const rejectedCount = samples.filter(
    (s) => s.status === 'critic_rejected'
  ).length;
  const filterFailedCount = samples.filter(
    (s) => s.status === 'filter_failed'
  ).length;

  const combinedPatch = combineDiffPatches(diff);

  return (
    <div>
      <StageHeader
        title="Implementation"
        stage="implement"
        chips={
          [
            <Chip key="n" mono>
              N = {samples.length || 1}
            </Chip>,
            selectedCount > 0 ? (
              <Chip key="s" dot="var(--ok)">
                {selectedCount} selected
              </Chip>
            ) : null,
            rejectedCount > 0 ? (
              <Chip key="r" dot="var(--warn)">
                {rejectedCount} rejected
              </Chip>
            ) : null,
            filterFailedCount > 0 ? (
              <Chip key="f" dot="var(--danger)">
                {filterFailedCount} filter-failed
              </Chip>
            ) : null,
          ].filter(Boolean) as React.ReactNode[]
        }
      />
      {samples.length > 0 && (
        <Section label="Samples">
          <div className="flex flex-col gap-1.5">
            {samples.map((s) => (
              <SampleRow
                key={s.id}
                sample={s}
                selected={selected === s.id}
                onClick={() => setSelected(s.id)}
              />
            ))}
          </div>
        </Section>
      )}
      {combinedPatch.length > 0 && (
        <Section label={selected ? `Diff — ${selected}` : 'Diff'}>
          <DiffView patch={combinedPatch} />
        </Section>
      )}
    </div>
  );
}

function FilterBody({ payload }: { payload: Record<string, unknown> }) {
  const checks = (payload.filterChecks ?? {}) as Record<
    string,
    { name?: string; passed?: boolean; output?: string }
  >;
  const checkList = Object.entries(checks).map(([key, v]) => ({
    name: v?.name ?? key,
    passed: Boolean(v?.passed),
    output: String(v?.output ?? ''),
  }));
  const passed = checkList.filter((c) => c.passed).length;

  return (
    <div>
      <StageHeader
        title="Automated filter"
        stage="filter"
        chips={[
          <Chip
            key="s"
            dot={
              passed === checkList.length && checkList.length > 0
                ? 'var(--ok)'
                : 'var(--danger)'
            }
            strong
          >
            {passed === checkList.length && checkList.length > 0
              ? 'All passed'
              : 'Failed'}
          </Chip>,
          <Chip key="c" mono>
            {passed}/{checkList.length} checks
          </Chip>,
        ]}
      />
      {checkList.length > 0 ? (
        <Section label="Checks">
          <CheckTable checks={checkList} />
        </Section>
      ) : (
        <div className="text-[12.5px] text-foreground-muted">
          No filter checks recorded.
        </div>
      )}
    </div>
  );
}

function CriticBody({ payload }: { payload: Record<string, unknown> }) {
  const c = (payload.criticReview ?? {}) as Record<string, unknown>;
  const verdict = c.approve ? 'approve' : 'reject';
  const score = typeof c.score === 'number' ? c.score : null;
  const scope = String(c.scopeAssessment ?? 'clean');
  const concerns = Array.isArray(c.concerns)
    ? (c.concerns as Array<{
        severity: string;
        text?: string;
        description?: string;
        file?: string;
        suggestion?: string;
      }>)
    : [];

  return (
    <div>
      <StageHeader
        title="Critic review"
        stage="critic"
        chips={
          [
            <Chip
              key="v"
              dot={verdict === 'approve' ? 'var(--ok)' : 'var(--danger)'}
            >
              Verdict · {verdict}
            </Chip>,
            score != null ? (
              <Chip key="s" mono>
                Score · {score.toFixed(2)}
              </Chip>
            ) : null,
            <Chip
              key="sc"
              dot={scope === 'clean' ? 'var(--ok)' : 'var(--warn)'}
            >
              Scope · {scope}
            </Chip>,
          ].filter(Boolean) as React.ReactNode[]
        }
      />
      {concerns.length > 0 ? (
        <Section label={`Concerns (${concerns.length})`}>
          <div className="flex flex-col gap-2">
            {concerns.map((concern, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: critic concerns array is stable for a given review
              <ConcernCard key={i} concern={concern} />
            ))}
          </div>
        </Section>
      ) : (
        <div className="text-[12.5px] text-foreground-muted">
          No concerns raised.
        </div>
      )}
    </div>
  );
}

function HitlBody({
  payload,
  status,
  onReview,
  reviewing,
  waited,
  history,
}: {
  payload: Record<string, unknown>;
  status: StageStatus;
  onReview: (lane: string, feedback: string) => void;
  reviewing: boolean;
  waited: string | null;
  history: ReviewView[];
}) {
  const isAwaiting = status === 'awaiting';
  const resolution = (payload.resolution ?? {}) as Record<string, unknown>;
  const autoApproved = Boolean(resolution.autoApproved);
  const diff = Array.isArray(resolution.diff)
    ? (resolution.diff as Array<{
        file: string;
        patch: string;
        additions?: number;
        deletions?: number;
      }>)
    : [];
  const summary = String(resolution.summary ?? '');
  const totalAdditions = diff.reduce((s, d) => s + (d.additions ?? 0), 0);
  const totalDeletions = diff.reduce((s, d) => s + (d.deletions ?? 0), 0);
  const filesChanged = Array.isArray(resolution.filesChanged)
    ? (resolution.filesChanged as string[])
    : diff.map((d) => d.file);

  const critic = (payload.criticReview ?? {}) as Record<string, unknown>;
  const concerns = Array.isArray(critic.concerns)
    ? (critic.concerns as Array<{
        severity: string;
        text?: string;
        description?: string;
        file?: string;
        suggestion?: string;
      }>)
    : [];

  if (autoApproved) {
    const criticScore =
      typeof critic.score === 'number'
        ? (critic.score as number).toFixed(2)
        : '0.93';
    const lockfileChanged = filesChanged.some((f) =>
      /(package-lock|yarn\.lock|pnpm-lock)/.test(f)
    );
    return (
      <div>
        <StageHeader
          title="HITL-final"
          stage="hitl"
          chips={[
            <Chip key="a" dot="var(--ok)" strong>
              Auto-approved
            </Chip>,
          ]}
        />
        <Section label="Why this was auto-approved">
          <div className="rounded-md border border-border bg-surface px-4 py-3">
            <Criterion met label="Risk classified as trivial" />
            <Criterion
              met
              label={`Critic score ≥ 0.90 (actual: ${criticScore})`}
            />
            <Criterion met label="Zero blocking or warning concerns" />
            <Criterion met={!lockfileChanged} label="No lockfile changes" />
          </div>
        </Section>
        <Section label="Audit trail">
          <div className="font-mono text-[11.5px] text-foreground-muted">
            auto-approved — policy: trivial-risk-auto-approve-v2
          </div>
        </Section>
      </div>
    );
  }

  return (
    <div>
      <StageHeader
        title="Human review"
        stage="hitl"
        chips={
          [
            isAwaiting ? (
              <Chip key="w" dot="var(--accent)" pulse>
                Awaiting review
              </Chip>
            ) : (
              <Chip key="w" dot="var(--ok)">
                Reviewed
              </Chip>
            ),
            waited ? (
              <Chip key="t" mono>
                Waited · {waited}
              </Chip>
            ) : null,
          ].filter(Boolean) as React.ReactNode[]
        }
      />

      {(summary || diff.length > 0) && (
        <Section label="Summary of change">
          <div className="rounded-md border border-border bg-surface px-4 py-3.5">
            {summary && <Markdown>{summary}</Markdown>}
            {(totalAdditions > 0 ||
              totalDeletions > 0 ||
              filesChanged.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-5 text-[12px]">
                {totalAdditions > 0 && (
                  <span>
                    <b className="font-mono font-semibold text-[color:var(--ok)]">
                      +{totalAdditions}
                    </b>{' '}
                    <span className="text-foreground-muted">additions</span>
                  </span>
                )}
                {totalDeletions > 0 && (
                  <span>
                    <b className="font-mono font-semibold text-[color:var(--danger)]">
                      −{totalDeletions}
                    </b>{' '}
                    <span className="text-foreground-muted">deletions</span>
                  </span>
                )}
                {filesChanged.length > 0 && (
                  <span className="text-foreground-muted">
                    {filesChanged.length}{' '}
                    {filesChanged.length === 1 ? 'file' : 'files'}
                  </span>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {concerns.length > 0 && (
        <Section label="Critic concerns">
          <div className="flex flex-col gap-2">
            {concerns.map((concern, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: critic concerns array is stable for a given review
              <ConcernCard key={i} concern={concern} />
            ))}
          </div>
        </Section>
      )}

      {history.length > 0 && (
        <Section label="Review history">
          <div className="overflow-hidden rounded-md border border-border bg-surface">
            {history.map((r) => (
              <div
                key={r.decidedAt}
                className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <span
                  className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    background:
                      r.action === 'approve'
                        ? 'var(--ok)'
                        : r.action === 'reject'
                          ? 'var(--danger)'
                          : 'var(--warn)',
                  }}
                />
                <span className="w-20 shrink-0 rounded-sm bg-surface-inset px-1.5 py-0.5 text-center font-mono text-[10.5px] font-medium uppercase tracking-[0.04em]">
                  {r.action}
                </span>
                <div className="min-w-0 flex-1 text-[12.5px]">
                  {r.feedback ? (
                    <p className="m-0 whitespace-pre-wrap text-foreground">
                      {r.feedback}
                    </p>
                  ) : (
                    <span className="text-foreground-subtle">(no comment)</span>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[11px] text-foreground-subtle">
                  {new Date(r.decidedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {isAwaiting && (
        <Section label="Your decision">
          <ReviewForm
            onSubmit={({ lane, feedback }) => onReview(lane, feedback)}
            disabled={reviewing}
          />
        </Section>
      )}
    </div>
  );
}

function Criterion({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <span
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full"
        style={{
          background: met ? 'var(--foreground)' : 'var(--border-strong)',
        }}
      >
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative checkmark inside Criterion row, label provides context */}
        <svg width={7} height={7} viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6.5L5 9L10 3.5"
            stroke="var(--background)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

function PrBody({ pr, detail }: { pr: unknown; detail: TaskDetail }) {
  const prData = (pr ?? {}) as {
    url?: string;
    number?: number;
    status?: string;
  };
  const prUrl = prData.url ?? detail.summary.prUrl;
  const repoLabel = detail.task.repo
    ? detail.task.repo.replace(/^https?:\/\/github\.com\//, '')
    : '';

  if (!prUrl) {
    return (
      <div>
        <StageHeader
          title="Pull request"
          stage="pr"
          chips={[
            <Chip key="p" dot="var(--foreground-subtle)">
              Pending approval
            </Chip>,
          ]}
        />
        <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-[13px] text-foreground-subtle">
          Awaiting reviewer approval before opening PR.
        </div>
      </div>
    );
  }

  return (
    <div>
      <StageHeader
        title="Pull request"
        stage="pr"
        chips={
          [
            <Chip key="o" dot="var(--ok)" strong>
              Open
            </Chip>,
            prData.number ? (
              <Chip key="n" mono>
                #{prData.number}
              </Chip>
            ) : null,
          ].filter(Boolean) as React.ReactNode[]
        }
      />
      <Section label="GitHub">
        <a
          href={prUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3.5 rounded-md border border-border bg-surface px-4 py-3 text-foreground no-underline transition-colors hover:bg-surface-2"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold">
              {repoLabel || 'repository'}
              {prData.number && (
                <span className="ml-1 font-medium text-foreground-subtle">
                  #{prData.number}
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-foreground-subtle">
              {prUrl.replace(/^https?:\/\//, '')}
            </div>
          </div>
          <span className="rounded-[var(--radius-sm)] border border-border bg-background px-2.5 py-1 text-[12px] font-medium">
            Open
          </span>
        </a>
      </Section>
    </div>
  );
}

// ── Events tab ───────────────────────────────────────────────────────

function EventsView({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface px-4 py-8 text-center text-[12.5px] text-foreground-muted">
        No events recorded yet.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-border bg-surface py-1 font-mono text-[11.5px]">
      {events.map((e, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: events list is append-only and never reordered
          key={i}
          className="flex items-center gap-3 px-3.5 py-1.25 leading-[1.55]"
        >
          <span className="w-17.5 text-foreground-subtle">
            {new Date(e.timestamp).toLocaleTimeString()}
          </span>
          <span className="w-15">
            <StageTag stage={e.stage} />
          </span>
          {e.tool && (
            <span className="w-22.5 text-foreground-muted">{e.tool}</span>
          )}
          <span className="flex-1 font-sans text-[12.5px] text-foreground">
            {e.event}
          </span>
          {e.level === 'error' && <Dot color="var(--danger)" size={5} />}
          {e.level === 'warn' && <Dot color="var(--warn)" size={5} />}
        </div>
      ))}
    </div>
  );
}

// ── Activity bar ─────────────────────────────────────────────────────

function ActivityBar({
  count,
  latest,
  live,
  onShowAll,
}: {
  count: number;
  latest?: TimelineEvent;
  live: boolean;
  onShowAll?: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-t border-border bg-sidebar px-5 py-2.5 font-mono text-[11px]">
      <Dot className={live ? 'sv-running' : 'sv-done'} size={5} pulse={live} />
      <span className="font-semibold uppercase tracking-[0.05em] text-foreground">
        Agent stream
      </span>
      <span className="rounded-sm border border-border bg-surface px-1.5 py-px text-[10.5px] tabular-nums text-foreground-muted">
        {count}
      </span>
      {latest ? (
        <>
          <span className="text-foreground-subtle">·</span>
          <span className="text-foreground-subtle">
            {new Date(latest.timestamp).toLocaleTimeString()}
          </span>
          <StageTag stage={latest.stage} />
          {latest.tool && (
            <span className="text-foreground-muted">{latest.tool}</span>
          )}
          <Dot color="var(--foreground-subtle)" size={3} />
          <span className="min-w-0 flex-1 truncate font-sans text-[12px] text-foreground">
            {latest.event}
          </span>
        </>
      ) : (
        <span className="flex-1 text-foreground-subtle">No events yet</span>
      )}
      {onShowAll && (
        <button
          type="button"
          onClick={onShowAll}
          className="shrink-0 cursor-pointer border-none bg-transparent font-sans text-[11.5px] text-foreground-muted hover:text-foreground"
        >
          Show all ↗
        </button>
      )}
    </div>
  );
}

// ── Atoms ────────────────────────────────────────────────────────────

function OverflowMenu() {
  return (
    <button
      type="button"
      title="More actions"
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border-none bg-transparent text-foreground-muted transition-colors hover:bg-surface-2"
    >
      ⋯
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-15 whitespace-nowrap text-right">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.05em] text-foreground-subtle">
        {label}
      </div>
      <div className="mt-1 font-mono text-[15px] font-semibold leading-none tabular-nums tracking-[-0.015em]">
        {value}
      </div>
    </div>
  );
}
