import { builder } from '../../infrastructure/graphql/builder.js';

builder.prismaObject('WorkflowDefinition', {
  fields: (t) => ({
    id: t.exposeID('id'),
    kind: t.exposeString('kind'),
    displayName: t.exposeString('displayName'),
    version: t.exposeInt('version'),
    stages: t.relation('stages', {
      query: { orderBy: { order: 'asc' } },
    }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('WorkflowStage', {
  fields: (t) => ({
    id: t.exposeID('id'),
    workflowDefinitionId: t.exposeString('workflowDefinitionId'),
    name: t.exposeString('name'),
    label: t.exposeString('label'),
    order: t.exposeInt('order'),
    allowsRetry: t.exposeBoolean('allowsRetry'),
    allowsHitl: t.exposeBoolean('allowsHitl'),
    config: t.expose('config', { type: 'Json', nullable: true }),
  }),
});
