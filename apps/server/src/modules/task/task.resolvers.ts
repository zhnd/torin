import { builder } from '../../infrastructure/graphql/builder.js';
import { AnalyzeRepositoryService } from './services/analyze-repository.service.js';
import { CancelTaskService } from './services/cancel-task.service.js';
import { ResolveDefectService } from './services/resolve-defect.service.js';
import { ReviewTaskService } from './services/review-task.service.js';

// ── Queries ──────────────────────────────────────────────

builder.queryField('task', (t) =>
  t.prismaField({
    type: 'Task',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _parent, args, ctx) => {
      const where: Record<string, unknown> = { id: args.id };
      if (ctx.user) {
        where.userId = ctx.user.id;
      }
      return ctx.prisma.task.findFirst({ ...query, where });
    },
  })
);

builder.queryField('tasks', (t) =>
  t.prismaField({
    type: ['Task'],
    authScopes: { authenticated: true },
    args: {
      projectId: t.arg.string(),
      status: t.arg.string(),
    },
    resolve: (query, _parent, args, ctx) => {
      const where: Record<string, unknown> = { userId: ctx.user?.id };
      if (args.projectId) where.projectId = args.projectId;
      if (args.status) where.status = args.status;
      return ctx.prisma.task.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  })
);

// ── Mutations ────────────────────────────────────────────

builder.mutationField('analyzeRepository', (t) =>
  t.prismaField({
    type: 'Task',
    authScopes: { authenticated: true },
    args: {
      projectId: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const service = new AnalyzeRepositoryService(ctx.prisma);
      return service.execute(query, args.projectId, ctx.user);
    },
  })
);

builder.mutationField('resolveDefect', (t) =>
  t.prismaField({
    type: 'Task',
    authScopes: { authenticated: true },
    args: {
      projectId: t.arg.string({ required: true }),
      defectDescription: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const service = new ResolveDefectService(ctx.prisma);
      return service.execute(
        query,
        args.projectId,
        args.defectDescription,
        ctx.user
      );
    },
  })
);

builder.mutationField('reviewTask', (t) =>
  t.prismaField({
    type: 'Task',
    authScopes: { authenticated: true },
    args: {
      taskId: t.arg.string({ required: true }),
      action: t.arg.string({ required: true }),
      feedback: t.arg.string(),
    },
    resolve: async (query, _parent, args, ctx) => {
      const service = new ReviewTaskService(ctx.prisma);
      return service.execute(
        query,
        args.taskId,
        args.action,
        args.feedback,
        ctx.user
      );
    },
  })
);

builder.mutationField('cancelTask', (t) =>
  t.prismaField({
    type: 'Task',
    authScopes: { authenticated: true },
    args: {
      taskId: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const service = new CancelTaskService(ctx.prisma);
      return service.execute(query, args.taskId, ctx.user);
    },
  })
);
