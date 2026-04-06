import type { Prisma, PrismaClient } from '@torin/database';
import type { User } from 'better-auth';
import {
  NotFoundError,
  UnauthorizedError,
} from '../../../infrastructure/errors/app-error.js';
import type { UpdateProjectInput } from '../dto/update-project.input.js';

interface ProjectQuery {
  include?: Prisma.ProjectInclude;
  select?: Prisma.ProjectSelect;
}

export class UpdateProjectService {
  constructor(private prisma: PrismaClient) {}

  async execute(
    query: ProjectQuery,
    input: typeof UpdateProjectInput.$inferInput,
    user: User | null
  ) {
    if (!user) {
      throw new UnauthorizedError();
    }

    const project = await this.prisma.project.findFirst({
      where: { id: input.id, userId: user.id },
    });

    if (!project) {
      throw new NotFoundError('Project', input.id);
    }

    return this.prisma.project.update({
      ...query,
      where: { id: input.id },
      data: {
        ...(input.name != null && { name: input.name }),
        ...(input.repositoryUrl != null && {
          repositoryUrl: input.repositoryUrl,
        }),
      },
    });
  }
}
