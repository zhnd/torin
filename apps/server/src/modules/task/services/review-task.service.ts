import type { Prisma, PrismaClient } from '@torin/database';
import { createTemporalClient } from '@torin/workflow';
import type { User } from 'better-auth';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
} from '../../../infrastructure/errors/app-error.js';

interface TaskQuery {
  include?: Prisma.TaskInclude;
  select?: Prisma.TaskSelect;
}

export class ReviewTaskService {
  constructor(private prisma: PrismaClient) {}

  async execute(
    query: TaskQuery,
    taskId: string,
    action: string,
    feedback: string | null | undefined,
    user: User | null
  ) {
    if (!user) {
      throw new UnauthorizedError();
    }

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    });

    if (!task) {
      throw new NotFoundError('Task', taskId);
    }

    if (task.status !== 'AWAITING_REVIEW') {
      throw new AppError(
        `Task is not awaiting review (current status: ${task.status})`,
        'INVALID_STATE',
        400
      );
    }

    if (!task.workflowId) {
      throw new AppError('Task has no associated workflow', 'NO_WORKFLOW', 400);
    }

    const client = await createTemporalClient();
    const handle = client.workflow.getHandle(task.workflowId);
    await handle.signal('reviewDecision', {
      decisionType: 'binary',
      action: action as 'approve' | 'reject',
      feedback: feedback ?? undefined,
    });

    return this.prisma.task.findUniqueOrThrow({
      ...query,
      where: { id: taskId },
    });
  }
}
