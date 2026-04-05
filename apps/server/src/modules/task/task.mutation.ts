import { createTemporalClient, TASK_QUEUE } from '@torin/workflow';
import { builder } from '../../infrastructure/graphql/builder.js';

builder.mutationField('analyzeRepository', (t) =>
  t.prismaField({
    type: 'Task',
    args: {
      url: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const task = await ctx.prisma.task.create({
        ...query,
        data: {
          repositoryUrl: args.url,
          status: 'PENDING',
        },
      });

      const client = await createTemporalClient();
      const handle = await client.workflow.start('analyzeRepositoryWorkflow', {
        taskQueue: TASK_QUEUE,
        workflowId: `analyze-${task.id}`,
        args: [{ taskId: task.id, repositoryUrl: args.url }],
      });

      return ctx.prisma.task.update({
        ...query,
        where: { id: task.id },
        data: { workflowId: handle.workflowId },
      });
    },
  })
);
