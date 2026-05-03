import type { DefectAnalysis, ResolveDefectInput } from '@torin/domain';
import { shouldAutoApproveAnalysis } from '../../../utils/trivial-gate.js';
import { MAX_ANALYSIS_ROUNDS } from '../constants.js';
import type { PhaseContext } from '../index.js';
import { main, sandboxAgent } from '../proxies.js';
import { buildAnalyzeStageInput } from '../transformer.js';

/**
 * Analysis phase with HITL loop. Each round opens a new ANALYSIS stage
 * event. Trivial-class defects auto-approve and skip the gate; otherwise
 * we wait for a review and either return (approve) or loop with the
 * reviewer's feedback (reject).
 */
export async function runAnalyze(
  ctx: PhaseContext,
  input: ResolveDefectInput
): Promise<DefectAnalysis> {
  let feedback: string | undefined;

  for (let round = 0; round < MAX_ANALYSIS_ROUNDS; round++) {
    const { startedStage } = await main.updateTaskActivity({
      taskId: ctx.taskId,
      startStage: {
        stageKey: 'ANALYSIS',
        input: buildAnalyzeStageInput({
          defectDescription: input.defectDescription,
          feedback,
        }),
      },
    });
    const eventId = startedStage!.eventId;

    const { result: analysis } = await sandboxAgent.analyzeDefectActivity(
      ctx.sandboxState,
      input.defectDescription,
      feedback
    );

    // Trivial auto-approve gate: skip HITL for analyze when the agent
    // self-classified the defect as trivial and env flag is on.
    const autoAnalyze = shouldAutoApproveAnalysis(
      analysis,
      ctx.config.autoApproveTrivial ? 'true' : undefined
    );
    if (autoAnalyze.autoApprove) {
      await main.updateTaskActivity({
        taskId: ctx.taskId,
        updateStage: { eventId, status: 'COMPLETED', output: analysis },
      });
      return analysis;
    }

    // HITL gate
    await main.updateTaskActivity({
      taskId: ctx.taskId,
      updateStage: { eventId, status: 'AWAITING', output: analysis },
    });
    await ctx.reviewGate.resetAndWait();
    const decision = ctx.reviewGate.consume();

    if (decision.action === 'approve') {
      await main.updateTaskActivity({
        taskId: ctx.taskId,
        updateStage: { eventId, status: 'COMPLETED' },
      });
      return analysis;
    }

    await main.updateTaskActivity({
      taskId: ctx.taskId,
      updateStage: { eventId, status: 'REJECTED' },
    });
    feedback = decision.feedback;
  }

  throw new Error(
    `Analysis did not converge after ${MAX_ANALYSIS_ROUNDS} review rounds`
  );
}
