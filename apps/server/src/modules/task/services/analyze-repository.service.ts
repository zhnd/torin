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

export class AnalyzeRepositoryService {
  constructor(private prisma: PrismaClient) {}

  async execute(query: TaskQuery, projectId: string, user: User | null) {
    if (!user) {
      throw new UnauthorizedError();
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    const task = await this.prisma.task.create({
      ...query,
      data: {
        type: 'ANALYZE_REPOSITORY',
        status: 'PENDING',
        input: { repositoryUrl: project.repositoryUrl },
        userId: user.id,
        projectId: project.id,
      },
    });

    const client = await createTemporalClient();
    const handle = await client.workflow.start('analyzeRepositoryWorkflow', {
      taskQueue: TASK_QUEUE,
      workflowId: `analyze-${task.id}`,
      args: [{ taskId: task.id, repositoryUrl: project.repositoryUrl }],
    });

    return this.prisma.task.update({
      ...query,
      where: { id: task.id },
      data: { workflowId: handle.workflowId },
    });
  }
}
