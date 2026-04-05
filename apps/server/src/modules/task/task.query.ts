import { builder } from '../../infrastructure/graphql/builder.js';

builder.queryField('task', (t) =>
  t.prismaField({
    type: 'Task',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _parent, args, ctx) =>
      ctx.prisma.task.findUnique({ ...query, where: { id: args.id } }),
  })
);
