import type { Prisma, PrismaClient } from '@torin/database';
import { createTemporalClient, TASK_QUEUE } from '@torin/workflow';
import type { User } from 'better-auth';
import {
  NotFoundError,
  UnauthorizedError,
} from '../../../infrastructure/errors/app-error.js';

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
        repositoryUrl: project.repositoryUrl,
        status: 'PENDING',
        userId: user.id,
        projectId: project.id,
      },
    });

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
        },
      ],
    });

    return this.prisma.task.update({
      ...query,
      where: { id: task.id },
      data: { workflowId: handle.workflowId },
    });
  }
}
