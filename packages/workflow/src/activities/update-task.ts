import type { Prisma } from '@torin/database';
import { prisma } from '@torin/database';
import type { TaskStatus } from '@torin/domain';
import { log } from '../logger.js';

export async function updateTaskStatusActivity(
  taskId: string,
  status: TaskStatus,
  result?: unknown,
  error?: string
): Promise<void> {
  log.info(
    {
      taskId,
      status,
      hasResult: result !== undefined,
      hasError: error !== undefined,
    },
    'Updating task status'
  );
  const data: Prisma.TaskUpdateInput = { status };

  if (result !== undefined) {
    data.result = result as Prisma.InputJsonValue;
  }
  if (error !== undefined) {
    data.error = error;
  }

  await prisma.task.update({
    where: { id: taskId },
    data,
  });
}
