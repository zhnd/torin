import type { Prisma, PrismaClient } from '@torin/database';
import type { User } from 'better-auth';
import { UnauthorizedError } from '../../../infrastructure/errors/app-error.js';
import type { CreateProjectInput } from '../dto/create-project.input.js';

interface ProjectQuery {
  include?: Prisma.ProjectInclude;
  select?: Prisma.ProjectSelect;
}

export class CreateProjectService {
  constructor(private prisma: PrismaClient) {}

  async execute(
    query: ProjectQuery,
    input: typeof CreateProjectInput.$inferInput,
    user: User | null
  ) {
    if (!user) {
      throw new UnauthorizedError();
    }

    return this.prisma.project.create({
      ...query,
      data: {
        name: input.name,
        repositoryUrl: input.repositoryUrl,
        userId: user.id,
      },
    });
  }
}
