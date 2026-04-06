import {
  condition,
  defineSignal,
  proxyActivities,
  setHandler,
} from '@temporalio/workflow';
import type {
  BugAnalysis,
  FixBugInput,
  FixResult,
  ReviewDecision,
} from '@torin/domain';
import type * as activities from '../activities/index.js';
import { buildPrBody } from '../utils/build-pr-body.js';

// ── Activity proxies (grouped by timeout profile) ───────

const shortActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 2 },
});

const longActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 minutes',
  retry: { maximumAttempts: 2 },
});

const infraActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

// ── Signal ──────────────────────────────────────────────

export const reviewSignal = defineSignal<[ReviewDecision]>('reviewDecision');

// ── Workflow ────────────────────────────────────────────

export async function fixBugWorkflow(input: FixBugInput): Promise<void> {
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

  await shortActivities.updateTaskStatusActivity(input.taskId, 'RUNNING');

  let sandboxId: string | undefined;
  try {
    sandboxId = await infraActivities.createSandboxActivity(
      input.repositoryUrl,
      { projectId: input.projectId, fullClone: true }
    );

    // ── Phase 1: Analyze → Review loop ──
    const { analysis, feedback: approvalFeedback } = await analyzeLoop(
      input,
      sandboxId
    );

    // ── Phase 2: Implement → Diff review loop ──
    await shortActivities.updateTaskStatusActivity(input.taskId, 'RUNNING');
    const fix = await implementLoop(
      input,
      sandboxId,
      analysis,
      approvalFeedback
    );

    // ── Phase 3: Push + PR ──
    await shortActivities.saveTaskEventsActivity(
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

    await shortActivities.pushBranchActivity(sandboxId, fix.branch);

    const prResult = await shortActivities.createPullRequestActivity(
      input.projectId,
      fix.branch,
      fix.baseBranch,
      `Fix: ${fix.summary.slice(0, 60)}`,
      buildPrBody(input.bugDescription, analysis, fix)
    );

    if (fix.changes?.length > 0) {
      await shortActivities.addPrReviewCommentsActivity(
        input.projectId,
        prResult.number,
        fix.changes
      );
    }

    await shortActivities.saveTaskEventsActivity(
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

    await shortActivities.updateTaskStatusActivity(input.taskId, 'COMPLETED', {
      fix,
      pullRequest: prResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await shortActivities.updateTaskStatusActivity(
      input.taskId,
      'FAILED',
      undefined,
      message
    );
  } finally {
    if (sandboxId) {
      await infraActivities.destroySandboxActivity(sandboxId);
    }
  }

  // ── Inner loops ───────────────────────────────────────

  async function analyzeLoop(
    input: FixBugInput,
    sandboxId: string
  ): Promise<{ analysis: BugAnalysis; feedback: string | undefined }> {
    let feedback: string | undefined;

    while (true) {
      await shortActivities.saveTaskEventsActivity(
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
        await longActivities.analyzeBugActivity(
          sandboxId,
          input.bugDescription,
          feedback
        );

      await shortActivities.saveTaskEventsActivity(
        input.taskId,
        observation.events,
        observation.cost,
        { stage: 'analysis', status: 'completed' }
      );

      await shortActivities.updateTaskStatusActivity(
        input.taskId,
        'AWAITING_REVIEW',
        { analysis }
      );
      await resetAndWaitForReview();
      const decision = consumeReview();

      if (decision.action === 'approve') {
        return { analysis, feedback: decision.feedback };
      }
      feedback = decision.feedback;
    }
  }

  async function implementLoop(
    input: FixBugInput,
    sandboxId: string,
    analysis: BugAnalysis,
    initialFeedback: string | undefined
  ): Promise<FixResult> {
    let feedback = initialFeedback;

    while (true) {
      await shortActivities.saveTaskEventsActivity(
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

      const { result: fix, observation } =
        await longActivities.implementFixActivity(
          sandboxId,
          input.bugDescription,
          analysis,
          feedback
        );

      await shortActivities.saveTaskEventsActivity(
        input.taskId,
        observation.events,
        observation.cost,
        { stage: 'implement', status: 'completed' }
      );

      await shortActivities.updateTaskStatusActivity(
        input.taskId,
        'AWAITING_REVIEW',
        {
          fix,
          diff: fix.diff,
          changes: fix.changes,
          reviewNotes: fix.reviewNotes,
          testsPassed: fix.testsPassed,
          testOutput: fix.testOutput,
        }
      );
      await resetAndWaitForReview();
      const decision = consumeReview();

      if (decision.action === 'approve') {
        return fix;
      }
      feedback = decision.feedback;
      await shortActivities.updateTaskStatusActivity(input.taskId, 'RUNNING');
    }
  }
}
