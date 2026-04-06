import type { Prisma } from '@torin/database';
import { prisma } from '@torin/database';
import type { AgentCost, ObservedEvent, StageStatus } from '@torin/domain';
import { log } from '../logger.js';

export async function saveTaskEventsActivity(
  taskId: string,
  events: ObservedEvent[],
  cost: AgentCost | null,
  stageUpdate?: { stage: string; status: StageStatus }
): Promise<void> {
  log.info(
    { taskId, eventCount: events.length, hasCost: !!cost, stageUpdate },
    'Saving task events'
  );

  if (events.length > 0) {
    await prisma.taskEvent.createMany({
      data: events.map((e) => ({
        taskId,
        stage: e.stage,
        event: e.event,
        level: e.level,
        agent: e.agent,
        tool: e.tool,
        details: e.details,
        timestamp: new Date(e.timestamp),
      })),
    });
  }

  const data: Prisma.TaskUpdateInput = {};

  if (cost) {
    const current = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        totalCostUsd: true,
        inputTokens: true,
        outputTokens: true,
        durationMs: true,
        costBreakdown: true,
      },
    });

    data.totalCostUsd = (current?.totalCostUsd ?? 0) + cost.totalCostUsd;
    data.inputTokens = (current?.inputTokens ?? 0) + cost.inputTokens;
    data.outputTokens = (current?.outputTokens ?? 0) + cost.outputTokens;
    data.durationMs = (current?.durationMs ?? 0) + cost.durationMs;
    data.model = cost.model;

    const breakdown = ((current?.costBreakdown as unknown[]) ?? []) as Array<
      Record<string, unknown>
    >;
    breakdown.push({
      stage: stageUpdate?.stage ?? 'unknown',
      inputTokens: cost.inputTokens,
      outputTokens: cost.outputTokens,
      cost: cost.totalCostUsd,
      duration: `${(cost.durationMs / 1000).toFixed(1)}s`,
      model: cost.model,
    });
    data.costBreakdown = breakdown as Prisma.InputJsonValue;
  }

  if (stageUpdate) {
    data.currentStage = stageUpdate.stage;

    const current = await prisma.task.findUnique({
      where: { id: taskId },
      select: { stages: true },
    });
    const stages = (current?.stages as Record<string, string>) ?? {};
    stages[stageUpdate.stage] = stageUpdate.status;
    data.stages = stages as Prisma.InputJsonValue;
  }

  if (Object.keys(data).length > 0) {
    await prisma.task.update({ where: { id: taskId }, data });
  }
}
