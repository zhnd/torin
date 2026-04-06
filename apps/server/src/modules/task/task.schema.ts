import { builder } from '../../infrastructure/graphql/builder.js';

builder.prismaObject('Task', {
  fields: (t) => ({
    id: t.exposeID('id'),
    type: t.exposeString('type'),
    status: t.exposeString('status'),
    repositoryUrl: t.exposeString('repositoryUrl'),
    result: t.expose('result', { type: 'Json', nullable: true }),
    error: t.exposeString('error', { nullable: true }),
    workflowId: t.exposeString('workflowId', { nullable: true }),
    project: t.relation('project', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});
