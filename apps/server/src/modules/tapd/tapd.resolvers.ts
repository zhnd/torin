import {
  NotFoundError,
  UnauthorizedError,
} from '../../infrastructure/errors/app-error.js';
import { builder } from '../../infrastructure/graphql/builder.js';
import { SetTapdCredentialInput } from './dto/set-tapd-credential.input.js';
import { TapdBugsService } from './services/tapd-bugs.service.js';
import { TapdCredentialService } from './services/tapd-credential.service.js';
import { TapdBug, TapdCredentialStatus } from './tapd.schema.js';

// ── Queries ──────────────────────────────────────────────

builder.queryField('tapdCredentialStatus', (t) =>
  t.field({
    type: TapdCredentialStatus,
    authScopes: { authenticated: true },
    resolve: (_parent, _args, ctx) =>
      new TapdCredentialService(ctx.prisma).status(ctx.user),
  })
);

builder.queryField('tapdAssignedBugs', (t) =>
  t.field({
    type: [TapdBug],
    authScopes: { authenticated: true },
    resolve: (_parent, _args, ctx) =>
      new TapdBugsService(ctx.prisma).listAssigned(ctx.user),
  })
);

builder.queryField('tapdWorkspaceMappings', (t) =>
  t.prismaField({
    type: ['TapdWorkspaceProjectMap'],
    authScopes: { authenticated: true },
    resolve: (query, _parent, _args, ctx) =>
      ctx.prisma.tapdWorkspaceProjectMap.findMany({
        ...query,
        where: { userId: ctx.user?.id },
        orderBy: { createdAt: 'asc' },
      }),
  })
);

// ── Mutations ────────────────────────────────────────────

builder.mutationField('setTapdCredential', (t) =>
  t.field({
    type: TapdCredentialStatus,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({ type: SetTapdCredentialInput, required: true }),
    },
    resolve: (_parent, args, ctx) =>
      new TapdCredentialService(ctx.prisma).set(args.input, ctx.user),
  })
);

builder.mutationField('removeTapdCredential', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    resolve: (_parent, _args, ctx) =>
      new TapdCredentialService(ctx.prisma).remove(ctx.user),
  })
);

builder.mutationField('setTapdWorkspaceProjectMap', (t) =>
  t.prismaField({
    type: 'TapdWorkspaceProjectMap',
    authScopes: { authenticated: true },
    args: {
      workspaceId: t.arg.string({ required: true }),
      projectId: t.arg.string({ required: true }),
    },
    resolve: async (_query, _parent, args, ctx) => {
      const userId = ctx.user?.id;
      if (!userId) throw new UnauthorizedError();
      const project = await ctx.prisma.project.findFirst({
        where: { id: args.projectId, userId },
      });
      if (!project) throw new NotFoundError('Project', args.projectId);
      return ctx.prisma.tapdWorkspaceProjectMap.upsert({
        where: {
          userId_workspaceId: { userId, workspaceId: args.workspaceId },
        },
        create: {
          userId,
          workspaceId: args.workspaceId,
          projectId: args.projectId,
        },
        update: { projectId: args.projectId },
      });
    },
  })
);
