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

export class CancelTaskService {
  constructor(private prisma: PrismaClient) {}

  async execute(query: TaskQuery, taskId: string, user: User | null) {
    if (!user) {
      throw new UnauthorizedError();
    }

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    });

    if (!task) {
      throw new NotFoundError('Task', taskId);
    }

    if (task.status === 'COMPLETED' || task.status === 'FAILED') {
      throw new AppError(
        `Task is already ${task.status.toLowerCase()}`,
        'INVALID_STATE',
        400
      );
    }

    if (task.workflowId) {
      const client = await createTemporalClient();
      const handle = client.workflow.getHandle(task.workflowId);
      try {
        await handle.cancel();
      } catch {
        // Workflow may already be finished
      }
    }

    // Update status immediately — the workflow's catch block will also try,
    // but this ensures the UI reflects the cancellation right away
    return this.prisma.task.update({
      ...query,
      where: { id: taskId },
      data: { status: 'FAILED', error: 'Cancelled by user' },
    });
  }
}
