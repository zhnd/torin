import {
  condition,
  defineSignal,
  proxyActivities,
  setHandler,
} from '@temporalio/workflow';
import type {
  DefectAnalysis,
  ReproductionOracle,
  ResolutionResult,
  ResolveDefectInput,
  ReviewDecision,
} from '@torin/domain';
import type { SandboxState } from '@torin/sandbox';
import type * as activities from '../activities/index.js';
import { SANDBOX_TASK_QUEUE } from '../client/index.js';
import { buildPrBody } from '../utils/build-pr-body.js';

// ── Activity proxies ─────────────────────────────────────────────────
// main         — DB / GitHub API; high concurrency
// sandboxInfra — sandbox create / destroy / push / filter; 5 min cap
// sandboxAgent — agent-driven stages (analyze / reproduce / implement); 15 min cap

const main = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 2 },
});

const sandboxInfra = proxyActivities<typeof activities>({
  taskQueue: SANDBOX_TASK_QUEUE,
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 2 },
});

const sandboxAgent = proxyActivities<typeof activities>({
  taskQueue: SANDBOX_TASK_QUEUE,
  startToCloseTimeout: '20 minutes',
  retry: { maximumAttempts: 2 },
});

// ── Signal ───────────────────────────────────────────────────────────

export const reviewSignal = defineSignal<[ReviewDecision]>('reviewDecision');

// ── Loop caps ────────────────────────────────────────────────────────

const MAX_ANALYSIS_ROUNDS = 5;
const MAX_IMPLEMENT_ROUNDS = 3;
const MAX_REVIEW_ROUNDS = 5;

// ── Workflow ─────────────────────────────────────────────────────────

export async function resolveDefectWorkflow(
  input: ResolveDefectInput
): Promise<void> {
  let reviewResult: ReviewDecision | undefined;
  setHandler(reviewSignal, (decision) => {
    reviewResult = decision;
  });

  function resetAndWaitForReview(): Promise<void> {
    reviewResult = undefined;
    return condition(() => reviewResult !== undefined);
  }

  function consumeReview(): ReviewDecision {
    return reviewResult as unknown as ReviewDecision;
  }

  await main.updateTaskStatusActivity(input.taskId, 'RUNNING');

  let sandboxState: SandboxState | undefined;
  try {
    sandboxState = await sandboxInfra.createSandboxActivity(
      input.repositoryUrl,
      { projectId: input.projectId }
    );

    // Phase 1 — Analyze with HITL loop
    const analysis = await analyzeWithReview(input, sandboxState);

    // Phase 2 — Reproduce (conditional on analysis signals)
    const oracle = await maybeReproduce(input, sandboxState, analysis);

    // Phase 3 — Implement → Filter → HITL-final loop
    const resolution = await implementWithFilter(
      input,
      sandboxState,
      analysis,
      oracle
    );

    // Phase 4 — Push + PR
    await main.saveTaskEventsActivity(
      input.taskId,
      [
        {
          stage: 'pr',
          event: 'Creating pull request',
          level: 'info',
          timestamp: new Date().toISOString(),
        },
      ],
      null,
      { stage: 'pr', status: 'running' }
    );

    await sandboxInfra.pushBranchActivity(sandboxState, resolution.branch, {
      projectId: input.projectId,
    });

    const prResult = await main.createPullRequestActivity(
      input.projectId,
      resolution.branch,
      resolution.baseBranch,
      `Fix: ${resolution.summary.slice(0, 60)}`,
      buildPrBody(input.defectDescription, analysis, resolution)
    );

    if (resolution.changes?.length > 0) {
      await main.addPrReviewCommentsActivity(
        input.projectId,
        prResult.number,
        resolution.changes
      );
    }

    await main.saveTaskEventsActivity(
      input.taskId,
      [
        {
          stage: 'pr',
          event: `PR #${prResult.number} created`,
          level: 'info',
          timestamp: new Date().toISOString(),
        },
      ],
      null,
      { stage: 'pr', status: 'completed' }
    );

    await main.updateTaskStatusActivity(input.taskId, 'COMPLETED', {
      resolution,
      pullRequest: prResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await main.updateTaskStatusActivity(
      input.taskId,
      'FAILED',
      undefined,
      message
    );
  } finally {
    if (sandboxState) {
      await sandboxInfra.destroySandboxActivity(sandboxState);
    }
  }

  // ── Inner phases ───────────────────────────────────────────────────

  async function analyzeWithReview(
    input: ResolveDefectInput,
    sandboxState: SandboxState
  ): Promise<DefectAnalysis> {
    let feedback: string | undefined;

    for (let round = 0; round < MAX_ANALYSIS_ROUNDS; round++) {
      await main.saveTaskEventsActivity(
        input.taskId,
        [
          {
            stage: 'analysis',
            event:
              round === 0 ? 'Analysis started' : `Analysis retry #${round}`,
            level: 'info',
            timestamp: new Date().toISOString(),
          },
        ],
        null,
        { stage: 'analysis', status: 'running' }
      );

      const { result: analysis, observation } =
        await sandboxAgent.analyzeDefectActivity(
          sandboxState,
          input.defectDescription,
          feedback
        );

      await main.saveTaskEventsActivity(
        input.taskId,
        observation.events,
        observation.cost,
        { stage: 'analysis', status: 'completed' }
      );

      await main.updateTaskStatusActivity(input.taskId, 'AWAITING_REVIEW', {
        analysis,
      });
      await resetAndWaitForReview();
      const decision = consumeReview();

      if (decision.action === 'approve') {
        return analysis;
      }
      feedback = decision.feedback;
    }

    throw new Error(
      `Analysis did not converge after ${MAX_ANALYSIS_ROUNDS} review rounds`
    );
  }

  async function maybeReproduce(
    input: ResolveDefectInput,
    sandboxState: SandboxState,
    analysis: DefectAnalysis
  ): Promise<ReproductionOracle | null> {
    const shouldAttempt = analysis.hasTestInfra || analysis.hasWebUI;
    if (!shouldAttempt) {
      await main.saveTaskEventsActivity(
        input.taskId,
        [
          {
            stage: 'reproduce',
            event: 'Reproduction skipped (no test infra / web UI)',
            level: 'info',
            timestamp: new Date().toISOString(),
          },
        ],
        null,
        { stage: 'reproduce', status: 'skipped' }
      );
      return null;
    }

    await main.saveTaskEventsActivity(
      input.taskId,
      [
        {
          stage: 'reproduce',
          event: 'Generating reproduction oracle',
          level: 'info',
          timestamp: new Date().toISOString(),
        },
      ],
      null,
      { stage: 'reproduce', status: 'running' }
    );

    const { result: oracle, observation } =
      await sandboxAgent.reproduceDefectActivity(sandboxState, analysis);

    await main.saveTaskEventsActivity(
      input.taskId,
      observation.events,
      observation.cost,
      {
        stage: 'reproduce',
        status: oracle.mode === 'none' ? 'skipped' : 'completed',
      }
    );

    return oracle.mode === 'none' ? null : oracle;
  }

  async function implementWithFilter(
    input: ResolveDefectInput,
    sandboxState: SandboxState,
    analysis: DefectAnalysis,
    oracle: ReproductionOracle | null
  ): Promise<ResolutionResult> {
    let feedback: string | undefined;

    for (let round = 0; round < MAX_REVIEW_ROUNDS; round++) {
      // Inner: implement with automated-filter retry loop
      let resolution: ResolutionResult | undefined;
      let filterResult:
        | Awaited<ReturnType<typeof sandboxInfra.filterCandidateActivity>>
        | undefined;

      for (
        let innerRound = 0;
        innerRound < MAX_IMPLEMENT_ROUNDS;
        innerRound++
      ) {
        await main.saveTaskEventsActivity(
          input.taskId,
          [
            {
              stage: 'implement',
              event:
                innerRound === 0
                  ? 'Implementation started'
                  : `Implementation retry #${innerRound}`,
              level: 'info',
              timestamp: new Date().toISOString(),
            },
          ],
          null,
          { stage: 'implement', status: 'running' }
        );

        const { result, observation } =
          await sandboxAgent.implementResolutionActivity(
            sandboxState,
            input.defectDescription,
            analysis,
            oracle,
            feedback
          );
        resolution = result;

        await main.saveTaskEventsActivity(
          input.taskId,
          observation.events,
          observation.cost,
          { stage: 'implement', status: 'completed' }
        );

        await main.saveTaskEventsActivity(
          input.taskId,
          [
            {
              stage: 'filter',
              event: 'Running automated checks',
              level: 'info',
              timestamp: new Date().toISOString(),
            },
          ],
          null,
          { stage: 'filter', status: 'running' }
        );

        filterResult = await sandboxInfra.filterCandidateActivity({
          state: sandboxState,
          analysis,
          oracle,
          resolution: result,
          projectId: input.projectId,
        });

        await main.saveTaskEventsActivity(
          input.taskId,
          [
            {
              stage: 'filter',
              event: filterResult.overallPassed
                ? 'All automated checks passed'
                : 'Automated checks failed',
              level: filterResult.overallPassed ? 'info' : 'warn',
              timestamp: new Date().toISOString(),
            },
          ],
          null,
          {
            stage: 'filter',
            status: filterResult.overallPassed ? 'completed' : 'failed',
          }
        );

        if (filterResult.overallPassed) {
          break;
        }
        feedback = filterResult.failureSummary;
      }

      if (!resolution || !filterResult || !filterResult.overallPassed) {
        throw new Error(
          `Implement did not pass automated filter after ${MAX_IMPLEMENT_ROUNDS} attempts`
        );
      }

      // HITL-final review
      await main.updateTaskStatusActivity(input.taskId, 'AWAITING_REVIEW', {
        resolution,
        diff: resolution.diff,
        changes: resolution.changes,
        reviewNotes: resolution.reviewNotes,
        testsPassed: resolution.testsPassed,
        testOutput: resolution.testOutput,
        previewUrl: filterResult.previewUrl,
        filterChecks: {
          oracle: filterResult.oracleCheck,
          regression: filterResult.regressionCheck,
          build: filterResult.buildCheck,
          lint: filterResult.lintCheck,
          boot: filterResult.bootCheck,
        },
      });

      await resetAndWaitForReview();
      const decision = consumeReview();

      if (decision.action === 'approve') {
        return {
          ...resolution,
          reproductionOracle: oracle ?? undefined,
          previewUrl: filterResult.previewUrl,
          filterChecks: buildFilterChecksRecord(filterResult),
          autoApproved: false,
        };
      }
      feedback = decision.feedback;
      await main.updateTaskStatusActivity(input.taskId, 'RUNNING');
    }

    throw new Error(
      `Resolution did not converge after ${MAX_REVIEW_ROUNDS} review rounds`
    );
  }
}

type FilterCandidateResult = Awaited<
  ReturnType<typeof sandboxInfra.filterCandidateActivity>
>;

function buildFilterChecksRecord(
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
