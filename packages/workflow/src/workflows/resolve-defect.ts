import {
  condition,
  defineSignal,
  proxyActivities,
  setHandler,
} from '@temporalio/workflow';
import type {
  DefectAnalysis,
  ResolutionResult,
  ResolveDefectInput,
  ReviewDecision,
} from '@torin/domain';
import type { SandboxState } from '@torin/sandbox';
import type * as activities from '../activities/index.js';
import { SANDBOX_TASK_QUEUE } from '../client/index.js';
import { buildPrBody } from '../utils/build-pr-body.js';

// ── Activity proxies ─────────────────────────────────────
// Main queue: DB / GitHub API — unbounded concurrency.
// Sandbox queue: everything that touches a Docker container — concurrency
// capped by SANDBOX_CONCURRENCY at the worker.

const main = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 2 },
});

const sandboxInfra = proxyActivities<typeof activities>({
  taskQueue: SANDBOX_TASK_QUEUE,
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 2 },
});

const sandboxAgent = proxyActivities<typeof activities>({
  taskQueue: SANDBOX_TASK_QUEUE,
  startToCloseTimeout: '15 minutes',
  retry: { maximumAttempts: 2 },
});

// ── Signal ──────────────────────────────────────────────

export const reviewSignal = defineSignal<[ReviewDecision]>('reviewDecision');

// ── Workflow ────────────────────────────────────────────

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

    // ── Phase 1: Analyze → Review loop ──
    const { analysis, feedback: approvalFeedback } = await analyzeLoop(
      input,
      sandboxState
    );

    // ── Phase 2: Implement → Diff review loop ──
    await main.updateTaskStatusActivity(input.taskId, 'RUNNING');
    const resolution = await implementLoop(
      input,
      sandboxState,
      analysis,
      approvalFeedback
    );

    // ── Phase 3: Push + PR ──
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

  // ── Inner loops ───────────────────────────────────────

  async function analyzeLoop(
    input: ResolveDefectInput,
    sandboxState: SandboxState
  ): Promise<{ analysis: DefectAnalysis; feedback: string | undefined }> {
    let feedback: string | undefined;

    while (true) {
      await main.saveTaskEventsActivity(
        input.taskId,
        [
          {
            stage: 'analysis',
            event: 'Analysis stage started',
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
        return { analysis, feedback: decision.feedback };
      }
      feedback = decision.feedback;
    }
  }

  async function implementLoop(
    input: ResolveDefectInput,
    sandboxState: SandboxState,
    analysis: DefectAnalysis,
    initialFeedback: string | undefined
  ): Promise<ResolutionResult> {
    let feedback = initialFeedback;

    while (true) {
      await main.saveTaskEventsActivity(
        input.taskId,
        [
          {
            stage: 'implement',
            event: 'Implementation stage started',
            level: 'info',
            timestamp: new Date().toISOString(),
          },
        ],
        null,
        { stage: 'implement', status: 'running' }
      );

      const { result: resolution, observation } =
        await sandboxAgent.implementResolutionActivity(
          sandboxState,
          input.defectDescription,
          analysis,
          feedback
        );

      await main.saveTaskEventsActivity(
        input.taskId,
        observation.events,
        observation.cost,
        { stage: 'implement', status: 'completed' }
      );

      await main.updateTaskStatusActivity(input.taskId, 'AWAITING_REVIEW', {
        resolution,
        diff: resolution.diff,
        changes: resolution.changes,
        reviewNotes: resolution.reviewNotes,
        testsPassed: resolution.testsPassed,
        testOutput: resolution.testOutput,
      });
      await resetAndWaitForReview();
      const decision = consumeReview();

      if (decision.action === 'approve') {
        return resolution;
      }
      feedback = decision.feedback;
      await main.updateTaskStatusActivity(input.taskId, 'RUNNING');
    }
  }
}
