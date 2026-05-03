import type {
  DefectAnalysis,
  ReproductionOracle,
  ResolutionResult,
  ResolveDefectInput,
} from '@torin/domain';
import { renderViolations } from '../../../utils/precondition-check.js';
import {
  type AttemptMemo,
  buildRetryFeedback,
} from '../../../utils/retry-feedback.js';
import {
  isAutoApprovable,
  recommendedSampleCount,
} from '../../../utils/trivial-gate.js';
import { IMPLEMENT_SAMPLES, MAX_REVIEW_ROUNDS } from '../constants.js';
import type { PhaseContext } from '../index.js';
import { main, sandboxAgent, sandboxInfra } from '../proxies.js';
import {
  buildAutoApprovedCriticOutput,
  buildFilterCheckEntry,
  buildFinalResolution,
  buildHitlCriticOutput,
  buildImplementStageInput,
  buildSampleSummary,
  type Candidate,
  type CriticReviewEntry,
  type FilterCheckEntry,
  memoFromCriticRejection,
  memoFromFilterFailure,
  memoFromHitlRejection,
  type SampleSummary,
  selectTopCandidate,
} from '../transformer.js';

/**
 * Implement phase with best-of-N sampling and final HITL gate.
 *
 * Per round:
 *   1. Open IMPLEMENT.
 *   2. Run N samples (each: agent → filter → optional critic → memo if any failure).
 *   3. If no candidate passed, mark IMPLEMENT FAILED and throw.
 *   4. Select top candidate, close IMPLEMENT, open + close FILTER, open CRITIC.
 *   5. CRITIC: trivial auto-approve OR HITL gate.
 *   6. On approve, return final resolution. On reject, mark CRITIC REJECTED
 *      and loop with accumulated feedback.
 *
 * Memos accumulate across rounds (Reflexion-style) so later attempts
 * learn from earlier ones.
 */
export async function runImplement(
  ctx: PhaseContext,
  input: ResolveDefectInput,
  analysis: DefectAnalysis,
  oracle: ReproductionOracle | null
): Promise<ResolutionResult> {
  let reviewerFeedback: string | undefined;
  const attemptMemos: AttemptMemo[] = [];
  let detectedBaseBranch: string | undefined;

  for (let round = 0; round < MAX_REVIEW_ROUNDS; round++) {
    const { startedStage: implementStage } = await main.updateTaskActivity({
      taskId: ctx.taskId,
      startStage: {
        stageKey: 'IMPLEMENT',
        input: buildImplementStageInput({
          analysis,
          oracle,
          feedback: reviewerFeedback,
          priorAttempts: attemptMemos.length,
        }),
      },
    });
    const implementEventId = implementStage!.eventId;

    const candidates: Candidate[] = [];
    const sampleSummaries: SampleSummary[] = [];
    const filterCheckList: FilterCheckEntry[] = [];
    const criticReviewList: CriticReviewEntry[] = [];

    const samplesThisRound = recommendedSampleCount(
      analysis,
      IMPLEMENT_SAMPLES
    );

    for (let sampleId = 1; sampleId <= samplesThisRound; sampleId++) {
      if (sampleId > 1 || round > 0) {
        const reset = await sandboxInfra.resetSandboxActivity({
          state: ctx.sandboxState,
          ...(detectedBaseBranch ? { baseBranch: detectedBaseBranch } : {}),
        });
        detectedBaseBranch = reset.baseBranch;
      }

      let preconditionViolations: string[] | undefined;
      if (attemptMemos.length > 0) {
        const pre = await sandboxInfra.checkPreconditionsActivity({
          state: ctx.sandboxState,
          scopeDeclaration: analysis.scopeDeclaration,
          requiredFiles: oracle?.filePath ? [oracle.filePath] : undefined,
          requireCleanTree: true,
        });
        if (!pre.clean) {
          preconditionViolations = renderViolations(pre);
        }
      }

      const sampleFeedback = buildRetryFeedback({
        previousAttempts: attemptMemos,
        reviewerFeedback,
        preconditionViolations,
      });

      const { result } = await sandboxAgent.implementResolutionActivity(
        ctx.sandboxState,
        input.defectDescription,
        analysis,
        oracle,
        sampleFeedback || undefined
      );
      if (!detectedBaseBranch) {
        detectedBaseBranch = result.baseBranch;
      }

      const filterResult = await sandboxInfra.filterCandidateActivity({
        state: ctx.sandboxState,
        analysis,
        oracle,
        resolution: result,
        projectId: input.projectId,
      });

      sampleSummaries.push(buildSampleSummary({ sampleId, result }));
      filterCheckList.push(buildFilterCheckEntry({ sampleId, filterResult }));

      if (!filterResult.overallPassed) {
        attemptMemos.push(
          memoFromFilterFailure({
            attemptNum: attemptMemos.length + 1,
            result,
            filterResult,
          })
        );
        continue;
      }

      // FILTER passed → run critic.
      const criticOutcome = await sandboxAgent.criticResolutionActivity(
        ctx.sandboxState,
        input.defectDescription,
        analysis,
        oracle,
        result
      );
      const criticReview = criticOutcome.result;
      criticReviewList.push({ sampleId, review: criticReview });

      if (criticReview.approve) {
        const candidateBranch = `torin/cand-${round}-${sampleId}`;
        await sandboxInfra.renameBranchActivity(
          ctx.sandboxState,
          result.branch,
          candidateBranch
        );
        candidates.push({
          resolution: { ...result, branch: candidateBranch },
          originalBranch: result.branch,
          filterResult,
          criticReview,
        });
        continue;
      }

      // Critic rejected → memo with concerns; the next sample will see it.
      attemptMemos.push(
        memoFromCriticRejection({
          attemptNum: attemptMemos.length + 1,
          result,
          criticReview,
        })
      );
    }

    if (candidates.length === 0) {
      const error = `No sample passed filter + critic after ${samplesThisRound} attempts`;
      await main.updateTaskActivity({
        taskId: ctx.taskId,
        updateStage: { eventId: implementEventId, status: 'FAILED', error },
      });
      throw new Error(error);
    }

    // Pick the winner and restore its original branch name (the renames
    // during the loop kept candidates from clobbering each other).
    const selected = selectTopCandidate(candidates);
    await sandboxInfra.renameBranchActivity(
      ctx.sandboxState,
      selected.resolution.branch,
      selected.originalBranch
    );
    const resolution: ResolutionResult = {
      ...selected.resolution,
      branch: selected.originalBranch,
    };
    const { filterResult, criticReview } = selected;

    // Close IMPLEMENT, open FILTER (atomic boundary).
    const { startedStage: filterStage } = await main.updateTaskActivity({
      taskId: ctx.taskId,
      updateStage: {
        eventId: implementEventId,
        status: 'COMPLETED',
        output: {
          samples: sampleSummaries,
          selectedSampleId: candidates.length,
        },
      },
      startStage: {
        stageKey: 'FILTER',
        input: { sampleCount: samplesThisRound },
      },
    });
    const filterEventId = filterStage!.eventId;

    // Close FILTER, open CRITIC.
    const { startedStage: criticStage } = await main.updateTaskActivity({
      taskId: ctx.taskId,
      updateStage: {
        eventId: filterEventId,
        status: 'COMPLETED',
        output: { checks: filterCheckList },
      },
      startStage: {
        stageKey: 'CRITIC',
        input: { reviewCount: criticReviewList.length },
      },
    });
    const criticEventId = criticStage!.eventId;

    // Trivial auto-approve gate.
    const autoDecision = isAutoApprovable(
      analysis,
      resolution,
      criticReview,
      ctx.config.autoApproveTrivial ? 'true' : undefined
    );
    if (autoDecision.autoApprove) {
      await main.updateTaskActivity({
        taskId: ctx.taskId,
        updateStage: {
          eventId: criticEventId,
          status: 'COMPLETED',
          output: buildAutoApprovedCriticOutput({
            reviews: criticReviewList,
            resolution,
            criticReview,
            filterResult,
          }),
        },
      });
      return buildFinalResolution({
        resolution,
        oracle,
        filterResult,
        autoApproved: true,
      });
    }

    // HITL gate on CRITIC — output carries everything the reviewer needs.
    await main.updateTaskActivity({
      taskId: ctx.taskId,
      updateStage: {
        eventId: criticEventId,
        status: 'AWAITING',
        output: buildHitlCriticOutput({
          reviews: criticReviewList,
          resolution,
          criticReview,
          filterResult,
          oracle,
        }),
      },
    });

    await ctx.reviewGate.resetAndWait();
    const decision = ctx.reviewGate.consume();

    if (decision.action === 'approve') {
      await main.updateTaskActivity({
        taskId: ctx.taskId,
        updateStage: { eventId: criticEventId, status: 'COMPLETED' },
      });
      return buildFinalResolution({
        resolution,
        oracle,
        filterResult,
        autoApproved: false,
      });
    }

    // Rejected — close CRITIC as REJECTED, accumulate memo, loop.
    await main.updateTaskActivity({
      taskId: ctx.taskId,
      updateStage: { eventId: criticEventId, status: 'REJECTED' },
    });
    attemptMemos.push(
      memoFromHitlRejection({
        attemptNum: attemptMemos.length + 1,
        resolution,
        decision,
      })
    );
    reviewerFeedback = decision.feedback;
  }

  throw new Error(
    `Resolution did not converge after ${MAX_REVIEW_ROUNDS} review rounds`
  );
}
