import { Chip } from '@/components/common/chip';
import { Markdown } from '@/components/common/markdown';
import type { StageData, TaskDetail } from '../../../types';
import { latestOutput } from '../../stage-body/libs';
import { Section, StageHeader } from '../../stage-body/parts';

interface AnalysisResultShape {
  summary?: unknown;
  techStack?: unknown;
  patterns?: unknown;
  structure?: unknown;
  recommendations?: unknown;
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string')
    : [];
}

interface AnalyzeRepositoryViewProps {
  detail: TaskDetail;
  analyzeStage: StageData;
}

/**
 * Single-stage analyze-repository overview. Renders the AnalysisResult
 * payload (`packages/domain/src/agent-outputs/analysis-result.ts`) folded
 * out of the analyze stage's latest attempt. No pipeline rail — this
 * workflow only emits one stage (ANALYSIS).
 */
export function AnalyzeRepositoryView({
  detail: _detail,
  analyzeStage,
}: AnalyzeRepositoryViewProps) {
  const status = analyzeStage.status;
  const latest = analyzeStage.attempts.at(-1);
  // `done` is the StageStatus shown for COMPLETED on the wire; see
  // normalizeStatus in task-detail/use-service.ts.
  const isCompleted = status === 'done';
  const isFailed = status === 'failed';
  const placeholderMessage =
    status === 'pending'
      ? 'Waiting to start.'
      : status === 'running'
        ? 'Analyzing repository…'
        : status === 'awaiting'
          ? 'Awaiting human review.'
          : status === 'skipped'
            ? 'Skipped.'
            : isFailed
              ? `Latest attempt failed${latest?.error ? `: ${latest.error}` : '.'}`
              : null;

  const stageData = analyzeStage
    ? {
        analyze: analyzeStage,
        // Other keys unused but required by latestOutput's StageDataMap type;
        // pass empty stand-ins.
        reproduce: { status: 'pending' as const, attempts: [] },
        implement: { status: 'pending' as const, attempts: [] },
        filter: { status: 'pending' as const, attempts: [] },
        critic: { status: 'pending' as const, attempts: [] },
        hitl: { status: 'pending' as const, attempts: [] },
        pr: { status: 'pending' as const, attempts: [] },
      }
    : null;

  const analysis = (
    isCompleted && stageData ? latestOutput(stageData, 'analyze') : null
  ) as AnalysisResultShape | null;

  const summary = analysis ? asString(analysis.summary) : '';
  const techStack = analysis ? asStringArray(analysis.techStack) : [];
  const patterns = analysis ? asStringArray(analysis.patterns) : [];
  const structure = analysis ? asString(analysis.structure) : '';
  const recommendations = analysis
    ? asStringArray(analysis.recommendations)
    : [];

  const hasAny =
    summary ||
    techStack.length > 0 ||
    patterns.length > 0 ||
    structure ||
    recommendations.length > 0;

  return (
    <div className="overflow-y-auto px-4 py-5 sm:px-6 lg:px-9 lg:py-7">
      <div className="mx-auto max-w-220 pb-12">
        <StageHeader
          title="Repository analysis"
          stage="analyze"
          chips={
            techStack.length > 0
              ? [
                  <Chip key="ts" mono>
                    {techStack.length} stack item
                    {techStack.length > 1 ? 's' : ''}
                  </Chip>,
                ]
              : undefined
          }
        />

        {placeholderMessage && (
          <div className="rounded-md border border-border-faint bg-surface-2 px-4 py-6 text-[13px] text-foreground-muted">
            {placeholderMessage}
          </div>
        )}

        {isCompleted && !hasAny && (
          <div className="rounded-md border border-border-faint bg-surface-2 px-4 py-6 text-[13px] text-foreground-muted">
            The agent returned an empty analysis. Check the Events tab for the
            raw transcript.
          </div>
        )}

        {summary && (
          <Section label="Summary">
            <Markdown>{summary}</Markdown>
          </Section>
        )}

        {techStack.length > 0 && (
          <Section label="Tech stack">
            <div className="flex flex-wrap gap-x-3.5 gap-y-1.5">
              {techStack.map((t) => (
                <Chip key={t} dot="var(--ok)" mono>
                  {t}
                </Chip>
              ))}
            </div>
          </Section>
        )}

        {structure && (
          <Section label="Structure">
            <Markdown className="text-[13.5px]">{structure}</Markdown>
          </Section>
        )}

        {patterns.length > 0 && (
          <Section label="Patterns">
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {patterns.map((p) => (
                <li
                  key={p}
                  className="rounded-sm border border-border-faint bg-surface-2 px-2.5 py-1.5 text-[13px] text-foreground-muted"
                >
                  {p}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {recommendations.length > 0 && (
          <Section label="Recommendations">
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {recommendations.map((r) => (
                <li
                  key={r}
                  className="rounded-sm border border-border-faint bg-surface-cream/40 px-3 py-2 text-[13.5px] leading-relaxed text-foreground"
                >
                  <Markdown>{r}</Markdown>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}
