import { builder } from '../../infrastructure/graphql/builder.js';
import { CreateProjectInput } from './dto/create-project.input.js';
import { UpdateProjectInput } from './dto/update-project.input.js';
import { CreateProjectService } from './services/create-project.service.js';
import { DeleteProjectService } from './services/delete-project.service.js';
import { UpdateProjectService } from './services/update-project.service.js';

// ── Queries ──────────────────────────────────────────────

builder.queryField('projects', (t) =>
  t.prismaField({
    type: ['Project'],
    authScopes: { authenticated: true },
    resolve: (query, _parent, _args, ctx) =>
      ctx.prisma.project.findMany({
        ...query,
        where: { userId: ctx.user?.id },
        orderBy: { updatedAt: 'desc' },
      }),
  })
);

builder.queryField('project', (t) =>
  t.prismaField({
    type: 'Project',
    nullable: true,
    authScopes: { authenticated: true },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _parent, args, ctx) =>
      ctx.prisma.project.findFirst({
        ...query,
        where: { id: args.id, userId: ctx.user?.id },
      }),
  })
);

// ── Mutations ────────────────────────────────────────────

builder.mutationField('createProject', (t) =>
  t.prismaField({
    type: 'Project',
    authScopes: { authenticated: true },
    args: {
      input: t.arg({ type: CreateProjectInput, required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const service = new CreateProjectService(ctx.prisma);
      return service.execute(query, args.input, ctx.user);
    },
  })
);

builder.mutationField('updateProject', (t) =>
  t.prismaField({
    type: 'Project',
    authScopes: { authenticated: true },
    args: {
      input: t.arg({ type: UpdateProjectInput, required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const service = new UpdateProjectService(ctx.prisma);
      return service.execute(query, args.input, ctx.user);
    },
  })
);

builder.mutationField('deleteProject', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const service = new DeleteProjectService(ctx.prisma);
      return service.execute(args.id, ctx.user);
    },
  })
);
