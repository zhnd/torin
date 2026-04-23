import { builder } from '../../infrastructure/graphql/builder.js';

// ── Layer 1: Execution telemetry ──────────────────────────────

builder.prismaObject('WorkflowExecution', {
  fields: (t) => ({
    id: t.exposeID('id'),
    taskId: t.exposeString('taskId'),
    workflowKind: t.exposeString('workflowKind'),
    workflowVersion: t.exposeInt('workflowVersion'),
    traceId: t.exposeString('traceId'),
    temporalWorkflowId: t.exposeString('temporalWorkflowId', {
      nullable: true,
    }),
    status: t.exposeString('status'),
    startedAt: t.expose('startedAt', { type: 'DateTime' }),
    endedAt: t.expose('endedAt', { type: 'DateTime', nullable: true }),
    durationMs: t.exposeInt('durationMs', { nullable: true }),
    stages: t.relation('stages', {
      query: { orderBy: { order: 'asc' } },
    }),
    retrospective: t.relation('retrospective', { nullable: true }),
  }),
});

builder.prismaObject('StageExecution', {
  fields: (t) => ({
    id: t.exposeID('id'),
    workflowExecutionId: t.exposeString('workflowExecutionId'),
    stageName: t.exposeString('stageName'),
    order: t.exposeInt('order'),
    status: t.exposeString('status'),
    spanId: t.exposeString('spanId'),
    parentSpanId: t.exposeString('parentSpanId'),
    startedAt: t.expose('startedAt', { type: 'DateTime' }),
    endedAt: t.expose('endedAt', { type: 'DateTime', nullable: true }),
    durationMs: t.exposeInt('durationMs', { nullable: true }),
    attempts: t.relation('attempts', {
      query: { orderBy: { attemptNumber: 'asc' } },
    }),
    reviews: t.relation('reviews', {
      query: { orderBy: { createdAt: 'asc' } },
    }),
  }),
});

builder.prismaObject('AttemptExecution', {
  fields: (t) => ({
    id: t.exposeID('id'),
    stageExecutionId: t.exposeString('stageExecutionId'),
    attemptNumber: t.exposeInt('attemptNumber'),
    triggerKind: t.exposeString('triggerKind'),
    triggerPayload: t.expose('triggerPayload', {
      type: 'Json',
      nullable: true,
    }),
    spanId: t.exposeString('spanId'),
    parentSpanId: t.exposeString('parentSpanId'),
    status: t.exposeString('status'),
    startedAt: t.expose('startedAt', { type: 'DateTime' }),
    endedAt: t.expose('endedAt', { type: 'DateTime', nullable: true }),
    durationMs: t.exposeInt('durationMs', { nullable: true }),
    invocations: t.relation('invocations', {
      query: { orderBy: { startedAt: 'asc' } },
    }),
    samples: t.relation('samples', {
      query: { orderBy: { sampleIndex: 'asc' } },
    }),
  }),
});

builder.prismaObject('AgentInvocation', {
  fields: (t) => ({
    id: t.exposeID('id'),
    attemptExecutionId: t.exposeString('attemptExecutionId'),
    agentName: t.exposeString('agentName'),
    model: t.exposeString('model'),
    status: t.exposeString('status'),
    errorText: t.exposeString('errorText', { nullable: true }),
    spanId: t.exposeString('spanId'),
    parentSpanId: t.exposeString('parentSpanId'),
    startedAt: t.expose('startedAt', { type: 'DateTime' }),
    endedAt: t.expose('endedAt', { type: 'DateTime', nullable: true }),
    durationMs: t.exposeInt('durationMs', { nullable: true }),
    totalCostUsd: t.exposeFloat('totalCostUsd', { nullable: true }),
    inputTokens: t.exposeInt('inputTokens', { nullable: true }),
    outputTokens: t.exposeInt('outputTokens', { nullable: true }),
    turns: t.relation('turns', {
      query: { orderBy: { turnIndex: 'asc' } },
    }),
    toolCalls: t.relation('toolCalls', {
      query: { orderBy: { startedAt: 'asc' } },
    }),
  }),
});

builder.prismaObject('AgentTurn', {
  fields: (t) => ({
    id: t.exposeID('id'),
    agentInvocationId: t.exposeString('agentInvocationId'),
    turnIndex: t.exposeInt('turnIndex'),
    role: t.exposeString('role'),
    textContent: t.exposeString('textContent', { nullable: true }),
    textTruncatedAt: t.exposeInt('textTruncatedAt', { nullable: true }),
    toolUseCount: t.exposeInt('toolUseCount'),
    inputTokens: t.exposeInt('inputTokens', { nullable: true }),
    outputTokens: t.exposeInt('outputTokens', { nullable: true }),
    startedAt: t.expose('startedAt', { type: 'DateTime' }),
    toolCalls: t.relation('toolCalls', {
      query: { orderBy: { startedAt: 'asc' } },
    }),
  }),
});

builder.prismaObject('ToolCall', {
  fields: (t) => ({
    id: t.exposeID('id'),
    agentInvocationId: t.exposeString('agentInvocationId'),
    agentTurnId: t.exposeString('agentTurnId', { nullable: true }),
    toolUseId: t.exposeString('toolUseId'),
    name: t.exposeString('name'),
    input: t.expose('input', { type: 'Json' }),
    output: t.exposeString('output', { nullable: true }),
    outputTruncatedAt: t.exposeInt('outputTruncatedAt', { nullable: true }),
    success: t.exposeBoolean('success', { nullable: true }),
    errorText: t.exposeString('errorText', { nullable: true }),
    spanId: t.exposeString('spanId'),
    parentSpanId: t.exposeString('parentSpanId'),
    startedAt: t.expose('startedAt', { type: 'DateTime' }),
    endedAt: t.expose('endedAt', { type: 'DateTime', nullable: true }),
    durationMs: t.exposeInt('durationMs', { nullable: true }),
  }),
});

// ── Layer 3: Domain aggregates ────────────────────────────────

builder.prismaObject('ResolutionSample', {
  fields: (t) => ({
    id: t.exposeID('id'),
    taskId: t.exposeString('taskId'),
    attemptExecutionId: t.exposeString('attemptExecutionId'),
    sampleIndex: t.exposeInt('sampleIndex'),
    branch: t.exposeString('branch'),
    summary: t.exposeString('summary'),
    filesChanged: t.expose('filesChanged', { type: 'Json' }),
    patch: t.exposeString('patch'),
    additions: t.exposeInt('additions'),
    deletions: t.exposeInt('deletions'),
    filterPassed: t.exposeBoolean('filterPassed'),
    filterChecks: t.expose('filterChecks', { type: 'Json', nullable: true }),
    criticApproved: t.exposeBoolean('criticApproved', { nullable: true }),
    criticScore: t.exposeFloat('criticScore', { nullable: true }),
    criticConcerns: t.expose('criticConcerns', {
      type: 'Json',
      nullable: true,
    }),
    selected: t.exposeBoolean('selected'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('HumanReview', {
  fields: (t) => ({
    id: t.exposeID('id'),
    taskId: t.exposeString('taskId'),
    stageExecutionId: t.exposeString('stageExecutionId'),
    decisionType: t.exposeString('decisionType'),
    action: t.exposeString('action'),
    feedback: t.exposeString('feedback', { nullable: true }),
    userId: t.exposeString('userId', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('Retrospective', {
  fields: (t) => ({
    id: t.exposeID('id'),
    workflowExecutionId: t.exposeString('workflowExecutionId'),
    summary: t.exposeString('summary', { nullable: true }),
    bottlenecks: t.expose('bottlenecks', { type: 'Json' }),
    recommendations: t.expose('recommendations', { type: 'Json' }),
    riskFactors: t.expose('riskFactors', { type: 'Json' }),
    stats: t.expose('stats', { type: 'Json' }),
    model: t.exposeString('model', { nullable: true }),
    costUsd: t.exposeFloat('costUsd', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('TaskResult', {
  fields: (t) => ({
    id: t.exposeID('id'),
    taskId: t.exposeString('taskId'),
    workflowKind: t.exposeString('workflowKind'),
    payload: t.expose('payload', { type: 'Json' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});
