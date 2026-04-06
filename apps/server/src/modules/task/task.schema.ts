import { builder } from '../../infrastructure/graphql/builder.js';

builder.prismaObject('TaskEvent', {
  fields: (t) => ({
    id: t.exposeID('id'),
    stage: t.exposeString('stage'),
    event: t.exposeString('event'),
    level: t.exposeString('level'),
    agent: t.exposeString('agent', { nullable: true }),
    tool: t.exposeString('tool', { nullable: true }),
    details: t.exposeString('details', { nullable: true }),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
  }),
});

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
    currentStage: t.exposeString('currentStage', { nullable: true }),
    stages: t.expose('stages', { type: 'Json', nullable: true }),
    totalCostUsd: t.exposeFloat('totalCostUsd', { nullable: true }),
    inputTokens: t.exposeInt('inputTokens', { nullable: true }),
    outputTokens: t.exposeInt('outputTokens', { nullable: true }),
    durationMs: t.exposeInt('durationMs', { nullable: true }),
    model: t.exposeString('model', { nullable: true }),
    costBreakdown: t.expose('costBreakdown', { type: 'Json', nullable: true }),
    events: t.relation('events', {
      query: { orderBy: { timestamp: 'asc' } },
    }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});
