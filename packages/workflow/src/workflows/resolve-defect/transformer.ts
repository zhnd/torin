import type {
  CriticReview,
  DefectAnalysis,
  ReproductionOracle,
  ResolutionResult,
  ReviewDecision,
} from '@torin/domain';
import type * as activities from '../../activities/index.js';
import {
  type AttemptMemo,
  memoFromAttempt,
} from '../../utils/retry-feedback.js';

// Data-shape transformers — input builders (workflow → activity input
// shape), output builders (activity result → stage event output shape),
// and memo builders (workflow internal state → retry feedback shape).
// Plus small candidate-selection helpers that only need pure types.
// Zero @temporalio/* imports — trivially unit-testable.

// ── Activity result + candidate types ───────────────────────────────

export type FilterCandidateResult = Awaited<
  ReturnType<typeof activities.filterCandidateActivity>
>;

export interface Candidate {
  resolution: ResolutionResult;
  originalBranch: string;
  filterResult: FilterCandidateResult;
  criticReview: CriticReview;
}

// ── Selection helpers ───────────────────────────────────────────────

/** Sum of additions + deletions across all files. */
export function diffSize(resolution: ResolutionResult): number {
  return resolution.diff.reduce((sum, d) => sum + d.additions + d.deletions, 0);
}

/**
 * Sort candidates by critic score desc, tiebreak by smaller diff.
 * Returns the top winner (caller has already verified `length > 0`).
 */
export function selectTopCandidate(candidates: Candidate[]): Candidate {
  const sorted = [...candidates].sort((a, b) => {
    const scoreDiff = b.criticReview.score - a.criticReview.score;
    if (Math.abs(scoreDiff) > 0.001) return scoreDiff;
    return diffSize(a.resolution) - diffSize(b.resolution);
  });
  return sorted[0];
}

/** Map filter activity result into a stable per-check record. */
export function buildFilterChecksRecord(
  r: FilterCandidateResult
): Record<string, NonNullable<FilterCandidateResult['oracleCheck']>> {
  const out: Record<
    string,
    NonNullable<FilterCandidateResult['oracleCheck']>
  > = {};
  if (r.oracleCheck) out.oracle = r.oracleCheck;
  if (r.regressionCheck) out.regression = r.regressionCheck;
  if (r.buildCheck) out.build = r.buildCheck;
  if (r.lintCheck) out.lint = r.lintCheck;
  if (r.bootCheck) out.boot = r.bootCheck;
  return out;
}

// ── Stage input builders ────────────────────────────────────────────

export function buildAnalyzeStageInput(args: {
  defectDescription: string;
  feedback: string | undefined;
}): unknown {
  return {
    defectDescription: args.defectDescription,
    feedback: args.feedback,
  };
}

export function buildReproduceStageInput(args: {
  analysis: DefectAnalysis;
}): unknown {
  return {
    hasTestInfra: args.analysis.hasTestInfra,
    hasWebUI: args.analysis.hasWebUI,
  };
}

export function buildImplementStageInput(args: {
  analysis: DefectAnalysis;
  oracle: ReproductionOracle | null;
  feedback: string | undefined;
  priorAttempts: number;
}): unknown {
  return {
    analysis: args.analysis,
    oracle: args.oracle,
    feedback: args.feedback,
    priorAttempts: args.priorAttempts,
  };
}

export function buildPrStageInput(args: {
  resolution: ResolutionResult;
}): unknown {
  return {
    branch: args.resolution.branch,
    baseBranch: args.resolution.baseBranch,
  };
}

// ── Per-sample summary shapes ───────────────────────────────────────

export interface SampleSummary {
  sampleId: number;
  summary: string;
  filesChanged: string[];
  additionsCount: number;
  deletionsCount: number;
}

export function buildSampleSummary(args: {
  sampleId: number;
  result: ResolutionResult;
}): SampleSummary {
  return {
    sampleId: args.sampleId,
    summary: args.result.summary,
    filesChanged: args.result.filesChanged,
    additionsCount: args.result.diff.reduce((s, d) => s + d.additions, 0),
    deletionsCount: args.result.diff.reduce((s, d) => s + d.deletions, 0),
  };
}

export interface FilterCheckEntry {
  sampleId: number;
  passed: boolean;
  oracle: FilterCandidateResult['oracleCheck'];
  regression: FilterCandidateResult['regressionCheck'];
  build: FilterCandidateResult['buildCheck'];
  lint: FilterCandidateResult['lintCheck'];
  boot: FilterCandidateResult['bootCheck'];
}

export function buildFilterCheckEntry(args: {
  sampleId: number;
  filterResult: FilterCandidateResult;
}): FilterCheckEntry {
  const r = args.filterResult;
  return {
    sampleId: args.sampleId,
    passed: r.overallPassed,
    oracle: r.oracleCheck,
    regression: r.regressionCheck,
    build: r.buildCheck,
    lint: r.lintCheck,
    boot: r.bootCheck,
  };
}

export interface CriticReviewEntry {
  sampleId: number;
  review: CriticReview;
}

// ── CRITIC stage output (auto-approve / HITL flavors) ───────────────
//
// IMPORTANT: top-level fields (`resolution`, `criticReview`, ...) are
// what the web's HitlBody reads — keep them at the root, not nested
// under `selected`. The web also wants the per-sample `reviews` list
// for the "review history" panel.

export function buildAutoApprovedCriticOutput(args: {
  reviews: CriticReviewEntry[];
  resolution: ResolutionResult;
  criticReview: CriticReview;
  filterResult: FilterCandidateResult;
}): unknown {
  return {
    reviews: args.reviews,
    resolution: args.resolution,
    criticReview: args.criticReview,
    filterChecks: buildFilterChecksRecord(args.filterResult),
    previewUrl: args.filterResult.previewUrl,
    autoApproved: true,
  };
}

export function buildHitlCriticOutput(args: {
  reviews: CriticReviewEntry[];
  resolution: ResolutionResult;
  criticReview: CriticReview;
  filterResult: FilterCandidateResult;
  oracle: ReproductionOracle | null;
}): unknown {
  return {
    reviews: args.reviews,
    resolution: args.resolution,
    diff: args.resolution.diff,
    changes: args.resolution.changes,
    reviewNotes: args.resolution.reviewNotes,
    testsPassed: args.resolution.testsPassed,
    testOutput: args.resolution.testOutput,
    previewUrl: args.filterResult.previewUrl,
    reproductionOracle: args.oracle ?? undefined,
    criticReview: args.criticReview,
    filterChecks: {
      oracle: args.filterResult.oracleCheck,
      regression: args.filterResult.regressionCheck,
      build: args.filterResult.buildCheck,
      lint: args.filterResult.lintCheck,
      boot: args.filterResult.bootCheck,
    },
  };
}

/** Wraps the selected resolution with reproduction + filter context for return. */
export function buildFinalResolution(args: {
  resolution: ResolutionResult;
  oracle: ReproductionOracle | null;
  filterResult: FilterCandidateResult;
  autoApproved: boolean;
}): ResolutionResult {
  return {
    ...args.resolution,
    reproductionOracle: args.oracle ?? undefined,
    previewUrl: args.filterResult.previewUrl,
    filterChecks: buildFilterChecksRecord(args.filterResult),
    autoApproved: args.autoApproved,
  };
}

// ── Memo builders (Reflexion retry context) ─────────────────────────

export function memoFromFilterFailure(args: {
  attemptNum: number;
  result: ResolutionResult;
  filterResult: FilterCandidateResult;
}): AttemptMemo {
  return memoFromAttempt({
    attemptNum: args.attemptNum,
    resolution: {
      summary: args.result.summary,
      filesChanged: args.result.filesChanged,
      diff: args.result.diff,
    },
    failureSummary: args.filterResult.failureSummary,
    failedChecks: [
      args.filterResult.oracleCheck,
      args.filterResult.regressionCheck,
      args.filterResult.buildCheck,
      args.filterResult.lintCheck,
      args.filterResult.bootCheck,
    ]
      .filter((c): c is NonNullable<typeof c> => c !== undefined)
      .filter((c) => !c.passed)
      .map((c) => ({ name: c.name, output: c.output })),
  });
}

export function memoFromCriticRejection(args: {
  attemptNum: number;
  result: ResolutionResult;
  criticReview: CriticReview;
}): AttemptMemo {
  const r = args.criticReview;
  return memoFromAttempt({
    attemptNum: args.attemptNum,
    resolution: {
      summary: args.result.summary,
      filesChanged: args.result.filesChanged,
      diff: args.result.diff,
    },
    failureSummary: `Critic rejected (scope: ${r.scopeAssessment}, score: ${r.score.toFixed(2)})`,
    failedChecks: r.concerns
      .filter((c) => c.severity !== 'info')
      .map((c) => ({
        name: `critic/${c.severity}`,
        output: `${c.description}${c.suggestion ? `\nSuggestion: ${c.suggestion}` : ''}${c.file ? ` [${c.file}]` : ''}`,
      })),
  });
}

export function memoFromHitlRejection(args: {
  attemptNum: number;
  resolution: ResolutionResult;
  decision: ReviewDecision;
}): AttemptMemo {
  return memoFromAttempt({
    attemptNum: args.attemptNum,
    resolution: {
      summary: args.resolution.summary,
      filesChanged: args.resolution.filesChanged,
      diff: args.resolution.diff,
    },
    failureSummary: `Rejected by reviewer: ${args.decision.feedback ?? '(no comment)'}`,
  });
}
