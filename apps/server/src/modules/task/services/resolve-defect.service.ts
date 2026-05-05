import type { Prisma, PrismaClient } from '@torin/database';
import { createTemporalClient, TASK_QUEUE } from '@torin/workflow';
import type { User } from 'better-auth';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
} from '../../../infrastructure/errors/app-error.js';
import { log } from '../../../logger.js';

interface TaskQuery {
  include?: Prisma.TaskInclude;
  select?: Prisma.TaskSelect;
}

export class ResolveDefectService {
  constructor(private prisma: PrismaClient) {}

  async execute(
    query: TaskQuery,
    projectId: string,
    defectDescription: string,
    user: User | null
  ) {
    if (!user) {
      throw new UnauthorizedError();
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    // Credentials are not checked here — public repos can be analyzed without a token.
    // Push and PR creation activities will check for credentials when they need them.

    const task = await this.prisma.task.create({
      ...query,
      data: {
        type: 'RESOLVE_DEFECT',
        status: 'PENDING',
        input: { defectDescription },
        userId: user.id,
        projectId: project.id,
      },
    });

    let workflowId: string;
    try {
      const client = await createTemporalClient();
      const handle = await client.workflow.start('resolveDefectWorkflow', {
        taskQueue: TASK_QUEUE,
        workflowId: `resolve-defect-${task.id}`,
        args: [
          {
            taskId: task.id,
            projectId: project.id,
            repositoryUrl: project.repositoryUrl,
            defectDescription,
            userId: user.id,
          },
        ],
      });
      workflowId = handle.workflowId;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error(
        { err, taskId: task.id, taskType: 'RESOLVE_DEFECT' },
        'workflow start failed'
      );
      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'FAILED',
          error: `Failed to start workflow: ${message}`,
        },
      });
      throw new AppError(
        'Could not start workflow — please retry shortly.',
        'WORKFLOW_START_FAILED',
        503
      );
    }

    return this.prisma.task.update({
      ...query,
      where: { id: task.id },
      data: { workflowId },
    });
  }
}
