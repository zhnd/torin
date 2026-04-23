import { builder } from '../../infrastructure/graphql/builder.js';
import { taskPubSub } from '../../infrastructure/graphql/pubsub.js';
import { log } from '../../logger.js';

/**
 * Live subscription for one task's state. Client subscribes with the
 * taskId; server listens for pubsub pings for that id and re-fetches
 * the full task (so Apollo's cache normalization can merge everything
 * at once). The `iterate` helper debounces bursts at 250 ms.
 *
 * Auth: subscribe resolver verifies task.userId === ctx.user.id on the
 * first fetch; if the task doesn't belong to the user, an error is
 * thrown and graphql-ws closes the stream.
 */
builder.subscriptionField('taskUpdated', (t) =>
  t.prismaField({
    type: 'Task',
    authScopes: { authenticated: true },
    args: {
      id: t.arg.string({ required: true }),
    },
    subscribe: async function* (_parent, { id }, ctx) {
      log.debug({ taskId: id, userId: ctx.user?.id }, 'taskUpdated: subscribe start');
      if (!ctx.user) {
        log.warn({ taskId: id }, 'taskUpdated: ctx.user missing — closing stream');
        return;
      }
      const task = await ctx.prisma.task.findFirst({
        where: { id, userId: ctx.user.id },
        select: { id: true },
      });
      if (!task) {
        log.warn(
          { taskId: id, userId: ctx.user.id },
          'taskUpdated: task not found or not owned — closing stream'
        );
        return;
      }
      log.debug({ taskId: id }, 'taskUpdated: baseline yield');
      yield id;
      let tick = 0;
      for await (const _ of taskPubSub.iterate(id)) {
        tick += 1;
        log.debug({ taskId: id, tick }, 'taskUpdated: pubsub tick → yielding');
        yield id;
      }
      log.debug({ taskId: id }, 'taskUpdated: subscribe loop ended');
    },
    resolve: async (query, id, _args, ctx) => {
      log.debug({ taskId: id }, 'taskUpdated: resolve start');
      const row = await ctx.prisma.task.findFirstOrThrow({
        ...query,
        where: { id: id as string, userId: ctx.user?.id },
      });
      log.debug({ taskId: id, status: (row as { status?: string }).status }, 'taskUpdated: resolve done');
      return row;
    },
  })
);
