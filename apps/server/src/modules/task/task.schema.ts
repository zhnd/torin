import { builder } from '../../infrastructure/graphql/builder.js';

/**
 * Typed domain event row. `eventType` + `payload` are the new source of
 * truth; legacy scalar columns are kept nullable for the transition
 * window so running clients don't crash during rollout.
 */
builder.prismaObject('TaskEvent', {
  fields: (t) => ({
    id: t.exposeID('id'),
    eventType: t.exposeString('eventType'),
    payload: t.expose('payload', { type: 'Json', nullable: true }),
    workflowExecutionId: t.exposeString('workflowExecutionId', {
      nullable: true,
    }),
    stageExecutionId: t.exposeString('stageExecutionId', { nullable: true }),
    attemptExecutionId: t.exposeString('attemptExecutionId', {
      nullable: true,
    }),
    traceId: t.exposeString('traceId', { nullable: true }),
    spanId: t.exposeString('spanId', { nullable: true }),
    occurredAt: t.expose('occurredAt', { type: 'DateTime' }),
    // Legacy columns (kept for one release)
    stage: t.exposeString('stage', { nullable: true }),
    event: t.exposeString('event', { nullable: true }),
    level: t.exposeString('level', { nullable: true }),
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
    error: t.exposeString('error', { nullable: true }),
    project: t.relation('project', { nullable: true }),

    // Denormalized aggregates (cached for list views)
    totalCostUsd: t.exposeFloat('totalCostUsd', { nullable: true }),
    inputTokens: t.exposeInt('inputTokens', { nullable: true }),
    outputTokens: t.exposeInt('outputTokens', { nullable: true }),
    durationMs: t.exposeInt('durationMs', { nullable: true }),
    model: t.exposeString('model', { nullable: true }),

    // Legacy fields (kept nullable through transition window)
    result: t.expose('result', { type: 'Json', nullable: true }),
    workflowId: t.exposeString('workflowId', { nullable: true }),
    currentStage: t.exposeString('currentStage', { nullable: true }),
    stages: t.expose('stages', { type: 'Json', nullable: true }),
    costBreakdown: t.expose('costBreakdown', {
      type: 'Json',
      nullable: true,
    }),

    // New relations — source of truth going forward
    executions: t.relation('executions', {
      query: { orderBy: { startedAt: 'desc' } },
    }),
    samples: t.relation('samples', {
      query: { orderBy: { sampleIndex: 'asc' } },
    }),
    reviews: t.relation('reviews', {
      query: { orderBy: { createdAt: 'asc' } },
    }),
    resultRecord: t.relation('resultRecord', { nullable: true }),

    events: t.relation('events', {
      query: { orderBy: { occurredAt: 'asc' } },
    }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});
