import type { EventLevel, TaskStage } from '@torin/domain';
import type {
  CostBreakdown,
  DiffFile,
  HealthAlert,
  LogEntry,
  ReplayStep,
  StageDetail,
  TaskDetail,
  TaskItem,
  TimelineEvent,
} from './types';

function stageDetail(
  status: StageDetail['status'],
  duration = '—',
  toolCalls = 0,
  summary = ''
): StageDetail {
  return { status, duration, toolCalls, summary };
}

export const MOCK_TASKS: TaskItem[] = [
  // --- Needs Review ---
  {
    id: 'task-004',
    title: 'Migrate database schema to v3',
    status: 'needs_review',
    repo: 'acme/data-service',
    branch: 'chore/schema-v3',
    workflow: 'migration',
    model: 'claude-opus-4-20250514',
    currentStage: 'pr',
    stages: {
      analysis: 'completed',
      plan: 'completed',
      implement: 'completed',
      test: 'completed',
      pr: 'running',
    },
    stageDetails: {
      analysis: stageDetail(
        'completed',
        '1m 45s',
        3,
        'Scanned 23 migration files'
      ),
      plan: stageDetail(
        'completed',
        '3m 10s',
        5,
        'Migration plan with rollback strategy'
      ),
      implement: stageDetail(
        'completed',
        '8m 22s',
        12,
        'Updated 7 schema files'
      ),
      test: stageDetail('completed', '4m 50s', 8, '34 tests passed'),
      pr: stageDetail(
        'running',
        '2m 03s',
        2,
        'PR draft created, awaiting review'
      ),
    },
    duration: '22m 10s',
    cost: '$1.84',
    sandbox: 'sbx-g7h8',
    badges: ['needs_review'],
    createdAt: '2026-04-06T08:30:00Z',
    projectName: 'Data Service',
    triggerSource: 'Linear ACME-892',
  },
  {
    id: 'task-011',
    title: 'Implement RBAC permission checks',
    status: 'needs_review',
    repo: 'acme/backend-api',
    branch: 'feat/rbac-permissions',
    workflow: 'full-implementation',
    model: 'claude-opus-4-20250514',
    currentStage: 'test',
    stages: {
      analysis: 'completed',
      plan: 'completed',
      implement: 'completed',
      test: 'completed',
      pr: 'pending',
    },
    stageDetails: {
      analysis: stageDetail(
        'completed',
        '2m 10s',
        4,
        'Identified 8 permission boundaries'
      ),
      plan: stageDetail(
        'completed',
        '4m 30s',
        6,
        '12-step implementation plan'
      ),
      implement: stageDetail(
        'completed',
        '15m 22s',
        24,
        'Created 5 middleware files, 3 decorators'
      ),
      test: stageDetail('completed', '6m 15s', 10, '48 passed, 0 failed'),
      pr: stageDetail('pending'),
    },
    duration: '28m 17s',
    cost: '$2.41',
    sandbox: 'sbx-r2s3',
    badges: ['needs_review'],
    createdAt: '2026-04-06T07:45:00Z',
    projectName: 'Backend API',
    triggerSource: 'GitHub Issue #287',
  },

  // --- Blocked ---
  {
    id: 'task-003',
    title: 'Fix N+1 query in dashboard resolver',
    status: 'blocked',
    repo: 'acme/backend-api',
    branch: 'fix/n-plus-one',
    workflow: 'bug-fix',
    model: 'claude-sonnet-4-20250514',
    currentStage: 'implement',
    stages: {
      analysis: 'completed',
      plan: 'completed',
      implement: 'running',
      test: 'pending',
      pr: 'pending',
    },
    stageDetails: {
      analysis: stageDetail(
        'completed',
        '1m 30s',
        3,
        'Found 4 N+1 queries in resolvers'
      ),
      plan: stageDetail('completed', '2m 10s', 4, 'Batch loader strategy'),
      implement: stageDetail(
        'running',
        '5m 48s',
        6,
        'Blocked: requires DB schema change approval'
      ),
      test: stageDetail('pending'),
      pr: stageDetail('pending'),
    },
    duration: '5m 48s',
    cost: '$0.22',
    sandbox: 'sbx-e5f6',
    badges: ['needs_review'],
    createdAt: '2026-04-06T09:50:00Z',
    projectName: 'Backend API',
    triggerSource: 'Datadog alert',
  },
  {
    id: 'task-012',
    title: 'Add OpenTelemetry tracing to payment flow',
    status: 'blocked',
    repo: 'acme/payments',
    branch: 'feat/otel-tracing',
    workflow: 'full-implementation',
    model: 'claude-sonnet-4-20250514',
    currentStage: 'implement',
    stages: {
      analysis: 'completed',
      plan: 'completed',
      implement: 'running',
      test: 'pending',
      pr: 'pending',
    },
    stageDetails: {
      analysis: stageDetail(
        'completed',
        '2m 05s',
        4,
        'Mapped 6 critical payment paths'
      ),
      plan: stageDetail(
        'completed',
        '3m 20s',
        5,
        'Span hierarchy for payment flow'
      ),
      implement: stageDetail(
        'running',
        '7m 12s',
        8,
        'Waiting for OTEL collector config'
      ),
      test: stageDetail('pending'),
      pr: stageDetail('pending'),
    },
    duration: '12m 37s',
    cost: '$0.55',
    sandbox: 'sbx-t4u5',
    badges: [],
    createdAt: '2026-04-06T09:20:00Z',
    projectName: 'Payments',
    triggerSource: 'Manual',
  },

  // --- Failed ---
  {
    id: 'task-007',
    title: 'Fix broken CI pipeline for staging',
    status: 'failed',
    repo: 'acme/infra',
    branch: 'fix/ci-staging',
    workflow: 'bug-fix',
    model: 'claude-sonnet-4-20250514',
    currentStage: 'test',
    stages: {
      analysis: 'completed',
      plan: 'completed',
      implement: 'completed',
      test: 'failed',
      pr: 'pending',
    },
    stageDetails: {
      analysis: stageDetail('completed', '1m 12s', 3, 'CI config analysis'),
      plan: stageDetail('completed', '1m 50s', 3, '3-step fix plan'),
      implement: stageDetail(
        'completed',
        '4m 20s',
        7,
        'Modified .github/workflows/staging.yml'
      ),
      test: stageDetail(
        'failed',
        '2m 00s',
        4,
        'Exit code 1: Docker build failed'
      ),
      pr: stageDetail('pending'),
    },
    duration: '9m 22s',
    cost: '$0.38',
    sandbox: 'sbx-m3n4',
    badges: ['failed'],
    createdAt: '2026-04-06T11:00:00Z',
    projectName: 'Infrastructure',
    triggerSource: 'Slack command',
  },
  {
    id: 'task-013',
    title: 'Implement email notification templates',
    status: 'failed',
    repo: 'acme/notifications',
    branch: 'feat/email-templates',
    workflow: 'full-implementation',
    model: 'claude-sonnet-4-20250514',
    currentStage: 'implement',
    stages: {
      analysis: 'completed',
      plan: 'completed',
      implement: 'failed',
      test: 'pending',
      pr: 'pending',
    },
    stageDetails: {
      analysis: stageDetail(
        'completed',
        '1m 40s',
        3,
        'Scanned existing template engine'
      ),
      plan: stageDetail('completed', '2m 30s', 4, '6 templates to create'),
      implement: stageDetail(
        'failed',
        '11m 05s',
        15,
        'Sandbox OOM: template engine memory leak'
      ),
      test: stageDetail('pending'),
      pr: stageDetail('pending'),
    },
    duration: '15m 15s',
    cost: '$0.67',
    sandbox: 'sbx-v6w7',
    badges: ['failed', 'path_deviation'],
    createdAt: '2026-04-06T10:30:00Z',
    projectName: 'Notifications',
    triggerSource: 'Linear ACME-1001',
  },

  // --- Running ---
  {
    id: 'task-001',
    title: 'Implement user authentication middleware',
    status: 'running',
    repo: 'acme/backend-api',
    branch: 'feat/auth-middleware',
    workflow: 'full-implementation',
    model: 'claude-sonnet-4-20250514',
    currentStage: 'implement',
    stages: {
      analysis: 'completed',
      plan: 'completed',
      implement: 'running',
      test: 'pending',
      pr: 'pending',
    },
    stageDetails: {
      analysis: stageDetail(
        'completed',
        '2m 12s',
        5,
        '47 files scanned, Express.js + Prisma'
      ),
      plan: stageDetail(
        'completed',
        '2m 25s',
        4,
        '5-step plan: middleware, verifier, routes, tests, PR'
      ),
      implement: stageDetail(
        'running',
        '6m 45s',
        9,
        'Creating auth middleware files'
      ),
      test: stageDetail('pending'),
      pr: stageDetail('pending'),
    },
    duration: '12m 34s',
    cost: '$0.47',
    sandbox: 'sbx-a1b2',
    badges: [],
    createdAt: '2026-04-06T10:23:00Z',
    projectName: 'Backend API',
    triggerSource: 'GitHub Issue #142',
  },
  {
    id: 'task-002',
    title: 'Add rate limiting to API endpoints',
    status: 'running',
    repo: 'acme/backend-api',
    branch: 'feat/rate-limit',
    workflow: 'full-implementation',
    model: 'claude-sonnet-4-20250514',
    currentStage: 'test',
    stages: {
      analysis: 'completed',
      plan: 'completed',
      implement: 'completed',
      test: 'running',
      pr: 'pending',
    },
    stageDetails: {
      analysis: stageDetail(
        'completed',
        '1m 30s',
        3,
        'Identified 12 rate-limitable endpoints'
      ),
      plan: stageDetail(
        'completed',
        '2m 00s',
        3,
        'Redis-based sliding window strategy'
      ),
      implement: stageDetail(
        'completed',
        '3m 42s',
        8,
        'Created rate limiter + Redis adapter'
      ),
      test: stageDetail('running', '1m 00s', 2, 'Running integration tests...'),
      pr: stageDetail('pending'),
    },
    duration: '8m 12s',
    cost: '$0.31',
    sandbox: 'sbx-c3d4',
    badges: ['path_deviation'],
    createdAt: '2026-04-06T10:15:00Z',
    projectName: 'Backend API',
    triggerSource: 'Linear ACME-456',
  },
  {
    id: 'task-010',
    title: 'Add error boundary to dashboard components',
    status: 'running',
    repo: 'acme/web-app',
    branch: 'feat/error-boundaries',
    workflow: 'full-implementation',
    model: 'claude-sonnet-4-20250514',
    currentStage: 'analysis',
    stages: {
      analysis: 'running',
      plan: 'pending',
      implement: 'pending',
      test: 'pending',
      pr: 'pending',
    },
    stageDetails: {
      analysis: stageDetail(
        'running',
        '1m 02s',
        2,
        'Scanning React component tree...'
      ),
      plan: stageDetail('pending'),
      implement: stageDetail('pending'),
      test: stageDetail('pending'),
      pr: stageDetail('pending'),
    },
    duration: '1m 02s',
    cost: '$0.04',
    sandbox: 'sbx-q7r8',
    badges: [],
    createdAt: '2026-04-06T11:12:00Z',
    projectName: 'Web App',
    triggerSource: 'Manual',
  },
  {
    id: 'task-014',
    title: 'Refactor GraphQL resolvers to use DataLoader',
    status: 'running',
    repo: 'acme/backend-api',
    branch: 'refactor/dataloader',
    workflow: 'full-implementation',
    model: 'claude-sonnet-4-20250514',
    currentStage: 'plan',
    stages: {
      analysis: 'completed',
      plan: 'running',
      implement: 'pending',
      test: 'pending',
      pr: 'pending',
    },
    stageDetails: {
      analysis: stageDetail(
        'completed',
        '3m 10s',
        6,
        'Found 14 resolvers with N+1 issues'
      ),
      plan: stageDetail(
        'running',
        '1m 45s',
        3,
        'Generating DataLoader batch functions...'
      ),
      implement: stageDetail('pending'),
      test: stageDetail('pending'),
      pr: stageDetail('pending'),
    },
    duration: '4m 55s',
    cost: '$0.18',
    sandbox: 'sbx-x8y9',
    badges: [],
    createdAt: '2026-04-06T11:05:00Z',
    projectName: 'Backend API',
    triggerSource: 'GitHub Issue #301',
  },

  // --- Completed (for Explorer only) ---
  {
    id: 'task-005',
    title: 'Refactor payment processing module',
    status: 'completed',
    repo: 'acme/payments',
    branch: 'refactor/payment-module',
    workflow: 'full-implementation',
    model: 'claude-sonnet-4-20250514',
    currentStage: 'pr',
    stages: {
      analysis: 'completed',
      plan: 'completed',
      implement: 'completed',
      test: 'completed',
      pr: 'completed',
    },
    stageDetails: {
      analysis: stageDetail(
        'completed',
        '2m 30s',
        4,
        'Mapped payment flow dependencies'
      ),
      plan: stageDetail('completed', '3m 15s', 5, '8-step refactor plan'),
      implement: stageDetail('completed', '9m 00s', 14, 'Split into 4 modules'),
      test: stageDetail('completed', '3m 00s', 6, '28 passed, 0 failed'),
      pr: stageDetail('completed', '1m 00s', 2, 'PR #156 merged'),
    },
    duration: '18m 45s',
    cost: '$0.92',
    sandbox: 'sbx-i9j0',
    badges: [],
    createdAt: '2026-04-06T07:00:00Z',
    projectName: 'Payments',
    triggerSource: 'Linear ACME-780',
  },
  {
    id: 'task-006',
    title: 'Add WebSocket support for real-time notifications',
    status: 'completed',
    repo: 'acme/backend-api',
    branch: 'feat/websocket-notifications',
    workflow: 'full-implementation',
    model: 'claude-sonnet-4-20250514',
    currentStage: 'pr',
    stages: {
      analysis: 'completed',
      plan: 'completed',
      implement: 'completed',
      test: 'completed',
      pr: 'completed',
    },
    stageDetails: {
      analysis: stageDetail(
        'completed',
        '2m 00s',
        3,
        'Analyzed real-time requirements'
      ),
      plan: stageDetail('completed', '3m 30s', 5, 'Socket.io integration plan'),
      implement: stageDetail(
        'completed',
        '14m 33s',
        18,
        'Created WS server + event handlers'
      ),
      test: stageDetail('completed', '4m 00s', 8, '22 passed, 0 failed'),
      pr: stageDetail('completed', '1m 00s', 2, 'PR #148 merged'),
    },
    duration: '25m 03s',
    cost: '$1.12',
    sandbox: 'sbx-k1l2',
    badges: [],
    createdAt: '2026-04-05T16:20:00Z',
    projectName: 'Backend API',
    triggerSource: 'GitHub Issue #201',
  },
  {
    id: 'task-008',
    title: 'Implement search indexing for products',
    status: 'queued',
    repo: 'acme/search-service',
    branch: 'feat/product-indexing',
    workflow: 'full-implementation',
    model: 'claude-sonnet-4-20250514',
    currentStage: 'analysis',
    stages: {
      analysis: 'pending',
      plan: 'pending',
      implement: 'pending',
      test: 'pending',
      pr: 'pending',
    },
    stageDetails: {
      analysis: stageDetail('pending'),
      plan: stageDetail('pending'),
      implement: stageDetail('pending'),
      test: stageDetail('pending'),
      pr: stageDetail('pending'),
    },
    duration: '—',
    cost: '$0.00',
    sandbox: '—',
    badges: [],
    createdAt: '2026-04-06T11:10:00Z',
    projectName: 'Search Service',
    triggerSource: 'Linear ACME-1100',
  },
  {
    id: 'task-009',
    title: 'Update OpenAPI spec for v2 endpoints',
    status: 'completed',
    repo: 'acme/backend-api',
    branch: 'docs/openapi-v2',
    workflow: 'documentation',
    model: 'claude-haiku-4-5-20251001',
    currentStage: 'pr',
    stages: {
      analysis: 'completed',
      plan: 'completed',
      implement: 'completed',
      test: 'skipped',
      pr: 'completed',
    },
    stageDetails: {
      analysis: stageDetail(
        'completed',
        '0m 45s',
        2,
        'Scanned 8 endpoint files'
      ),
      plan: stageDetail(
        'completed',
        '1m 10s',
        2,
        'OpenAPI 3.1 spec update plan'
      ),
      implement: stageDetail('completed', '1m 50s', 4, 'Updated openapi.yaml'),
      test: stageDetail('skipped', '—', 0, 'Documentation — tests skipped'),
      pr: stageDetail('completed', '0m 30s', 1, 'PR #160 merged'),
    },
    duration: '4m 15s',
    cost: '$0.08',
    sandbox: 'sbx-o5p6',
    badges: [],
    createdAt: '2026-04-05T14:00:00Z',
    projectName: 'Backend API',
    triggerSource: 'Manual',
  },
  {
    id: 'task-015',
    title: 'Add Stripe webhook handler for subscription events',
    status: 'completed',
    repo: 'acme/payments',
    branch: 'feat/stripe-webhooks',
    workflow: 'full-implementation',
    model: 'claude-sonnet-4-20250514',
    currentStage: 'pr',
    stages: {
      analysis: 'completed',
      plan: 'completed',
      implement: 'completed',
      test: 'completed',
      pr: 'completed',
    },
    stageDetails: {
      analysis: stageDetail(
        'completed',
        '1m 50s',
        3,
        'Mapped 6 Stripe event types'
      ),
      plan: stageDetail(
        'completed',
        '2m 40s',
        4,
        'Webhook handler + idempotency keys'
      ),
      implement: stageDetail(
        'completed',
        '7m 15s',
        11,
        'Handler + signature verification'
      ),
      test: stageDetail('completed', '3m 30s', 6, '18 passed, 0 failed'),
      pr: stageDetail('completed', '0m 45s', 2, 'PR #163 merged'),
    },
    duration: '16m 00s',
    cost: '$0.74',
    sandbox: 'sbx-a0b1',
    badges: [],
    createdAt: '2026-04-05T12:00:00Z',
    projectName: 'Payments',
    triggerSource: 'Linear ACME-845',
  },
];

function buildTaskDetail(task: TaskItem): TaskDetail {
  const timeline: TimelineEvent[] = [
    {
      timestamp: '2026-04-06T10:23:00Z',
      stage: 'analysis',
      event: 'Task queued',
      level: 'info',
      agent: 'orchestrator',
    },
    {
      timestamp: '2026-04-06T10:23:05Z',
      stage: 'analysis',
      event: 'Cloning repository',
      level: 'info',
      agent: 'orchestrator',
      tool: 'git',
      details: `git clone ${task.repo}`,
    },
    {
      timestamp: '2026-04-06T10:23:30Z',
      stage: 'analysis',
      event: 'Repository analysis started',
      level: 'info',
      agent: 'analyzer',
    },
    {
      timestamp: '2026-04-06T10:25:12Z',
      stage: 'analysis',
      event: 'Analysis complete — 47 files scanned',
      level: 'info',
      agent: 'analyzer',
      tool: 'file_search',
    },
    {
      timestamp: '2026-04-06T10:25:15Z',
      stage: 'plan',
      event: 'Generating implementation plan',
      level: 'info',
      agent: 'planner',
    },
    {
      timestamp: '2026-04-06T10:27:40Z',
      stage: 'plan',
      event: 'Plan approved — 5 steps identified',
      level: 'info',
      agent: 'planner',
    },
    {
      timestamp: '2026-04-06T10:27:45Z',
      stage: 'implement',
      event: 'Implementation started',
      level: 'info',
      agent: 'coder',
    },
    {
      timestamp: '2026-04-06T10:30:00Z',
      stage: 'implement',
      event: 'Created src/middleware/auth.ts',
      level: 'info',
      agent: 'coder',
      tool: 'file_write',
    },
    {
      timestamp: '2026-04-06T10:32:15Z',
      stage: 'implement',
      event: 'Modified src/routes/index.ts',
      level: 'info',
      agent: 'coder',
      tool: 'file_edit',
    },
    {
      timestamp: '2026-04-06T10:33:00Z',
      stage: 'implement',
      event: 'Path deviation — additional dependency required',
      level: 'warn',
      agent: 'coder',
      details: 'jsonwebtoken package not in project, using jose instead',
    },
    ...(task.stages.test !== 'pending'
      ? [
          {
            timestamp: '2026-04-06T10:34:00Z',
            stage: 'test' as TaskStage,
            event: 'Running test suite',
            level: 'info' as EventLevel,
            agent: 'tester',
            tool: 'shell',
          },
          ...(task.stages.test === 'failed'
            ? [
                {
                  timestamp: '2026-04-06T10:36:00Z',
                  stage: 'test' as TaskStage,
                  event: 'Tests failed — 2 failures in auth.test.ts',
                  level: 'error' as EventLevel,
                  agent: 'tester',
                  details: 'TypeError: Cannot read property of undefined',
                },
              ]
            : [
                {
                  timestamp: '2026-04-06T10:36:00Z',
                  stage: 'test' as TaskStage,
                  event: 'All tests passed (12/12)',
                  level: 'info' as EventLevel,
                  agent: 'tester',
                },
              ]),
        ]
      : []),
    ...(task.status === 'blocked'
      ? [
          {
            timestamp: '2026-04-06T10:36:30Z',
            stage: task.currentStage,
            event: 'Execution blocked — waiting for human approval',
            level: 'warn' as EventLevel,
            agent: 'orchestrator',
          },
        ]
      : []),
    ...(task.status === 'needs_review'
      ? [
          {
            timestamp: '2026-04-06T10:37:00Z',
            stage: task.currentStage,
            event: 'Awaiting human review before proceeding',
            level: 'warn' as EventLevel,
            agent: 'orchestrator',
          },
        ]
      : []),
  ];

  const logs: LogEntry[] = [
    {
      timestamp: '10:23:00.123',
      level: 'INFO',
      source: 'orchestrator',
      message: `Task ${task.id} started`,
    },
    {
      timestamp: '10:23:00.456',
      level: 'INFO',
      source: 'sandbox',
      message: `Sandbox ${task.sandbox} provisioned (node:20-slim)`,
    },
    {
      timestamp: '10:23:05.789',
      level: 'DEBUG',
      source: 'git',
      message: `Cloning ${task.repo} into /workspace`,
    },
    {
      timestamp: '10:23:28.012',
      level: 'INFO',
      source: 'git',
      message: 'Clone complete — 2.4MB, 312 files',
    },
    {
      timestamp: '10:23:30.345',
      level: 'INFO',
      source: 'agent',
      message: 'Starting repository analysis',
    },
    {
      timestamp: '10:25:12.678',
      level: 'INFO',
      source: 'agent',
      message:
        'Analysis complete: TypeScript project, Express.js, Prisma ORM, 47 source files',
    },
    {
      timestamp: '10:25:15.901',
      level: 'INFO',
      source: 'agent',
      message: 'Generating implementation plan',
    },
    {
      timestamp: '10:27:40.234',
      level: 'INFO',
      source: 'agent',
      message: 'Plan generated — 5 steps, estimated 8-12 minutes',
    },
    {
      timestamp: '10:27:45.567',
      level: 'INFO',
      source: 'sandbox',
      message: 'Running: npm install',
    },
    {
      timestamp: '10:28:10.890',
      level: 'DEBUG',
      source: 'sandbox',
      message: 'npm install completed (14 packages)',
    },
    {
      timestamp: '10:30:00.123',
      level: 'INFO',
      source: 'agent',
      message: 'Created file: src/middleware/auth.ts (142 lines)',
    },
    {
      timestamp: '10:32:15.456',
      level: 'INFO',
      source: 'agent',
      message: 'Modified file: src/routes/index.ts (+8 -2)',
    },
    {
      timestamp: '10:33:00.789',
      level: 'WARN',
      source: 'agent',
      message:
        'Path deviation: jsonwebtoken not available, switching to jose library',
    },
    {
      timestamp: '10:33:05.012',
      level: 'DEBUG',
      source: 'sandbox',
      message: 'Running: npm install jose',
    },
    {
      timestamp: '10:34:30.345',
      level: 'INFO',
      source: 'agent',
      message: 'Created file: src/middleware/token-verify.ts (87 lines)',
    },
    {
      timestamp: '10:35:22.678',
      level: 'ERROR',
      source: 'sandbox',
      message:
        'TypeScript compilation error: TS2345 in src/middleware/auth.ts:42',
    },
    {
      timestamp: '10:35:25.901',
      level: 'INFO',
      source: 'agent',
      message: 'Fixing compilation error — type mismatch in token payload',
    },
  ];

  const diff: DiffFile[] = [
    {
      path: 'src/middleware/auth.ts',
      additions: 142,
      deletions: 0,
      hunks: [
        {
          header: '@@ -0,0 +1,142 @@',
          lines: [
            {
              type: 'add',
              content:
                "import { type NextFunction, type Request, type Response } from 'express';",
            },
            {
              type: 'add',
              content: "import { jwtVerify, type JWTPayload } from 'jose';",
            },
            { type: 'add', content: '' },
            {
              type: 'add',
              content: 'interface AuthenticatedRequest extends Request {',
            },
            { type: 'add', content: '  user?: JWTPayload;' },
            { type: 'add', content: '}' },
            { type: 'add', content: '' },
            {
              type: 'add',
              content:
                'export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {',
            },
            {
              type: 'add',
              content:
                "  const token = req.headers.authorization?.replace('Bearer ', '');",
            },
            { type: 'add', content: '  if (!token) {' },
            {
              type: 'add',
              content:
                "    return res.status(401).json({ error: 'Unauthorized' });",
            },
            { type: 'add', content: '  }' },
            {
              type: 'add',
              content:
                "  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');",
            },
            {
              type: 'add',
              content: '  const { payload } = await jwtVerify(token, secret);',
            },
            { type: 'add', content: '  req.user = payload;' },
            { type: 'add', content: '  next();' },
            { type: 'add', content: '}' },
          ],
        },
      ],
    },
    {
      path: 'src/routes/index.ts',
      additions: 8,
      deletions: 2,
      hunks: [
        {
          header: '@@ -1,6 +1,12 @@',
          lines: [
            { type: 'context', content: "import { Router } from 'express';" },
            {
              type: 'remove',
              content: "import { publicRoutes } from './public';",
            },
            {
              type: 'add',
              content: "import { publicRoutes } from './public';",
            },
            {
              type: 'add',
              content: "import { authMiddleware } from '../middleware/auth';",
            },
            {
              type: 'add',
              content: "import { protectedRoutes } from './protected';",
            },
            { type: 'context', content: '' },
            { type: 'context', content: 'const router = Router();' },
            { type: 'remove', content: "router.use('/api', publicRoutes);" },
            {
              type: 'add',
              content: "router.use('/api/public', publicRoutes);",
            },
            {
              type: 'add',
              content: "router.use('/api', authMiddleware, protectedRoutes);",
            },
          ],
        },
      ],
    },
    {
      path: 'src/middleware/token-verify.ts',
      additions: 87,
      deletions: 0,
      hunks: [
        {
          header: '@@ -0,0 +1,87 @@',
          lines: [
            {
              type: 'add',
              content: "import { jwtVerify, SignJWT } from 'jose';",
            },
            { type: 'add', content: '' },
            {
              type: 'add',
              content: 'export async function verifyToken(token: string) {',
            },
            {
              type: 'add',
              content:
                "  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');",
            },
            {
              type: 'add',
              content: '  const { payload } = await jwtVerify(token, secret);',
            },
            { type: 'add', content: '  return payload;' },
            { type: 'add', content: '}' },
          ],
        },
      ],
    },
  ];

  const cost: CostBreakdown[] = [
    {
      stage: 'analysis',
      inputTokens: 12450,
      outputTokens: 3200,
      cost: 0.08,
      duration: '2m 12s',
      model: task.model,
    },
    {
      stage: 'plan',
      inputTokens: 18600,
      outputTokens: 5400,
      cost: 0.12,
      duration: '2m 25s',
      model: task.model,
    },
    {
      stage: 'implement',
      inputTokens: 32100,
      outputTokens: 8900,
      cost: 0.19,
      duration: '6m 45s',
      model: task.model,
    },
    {
      stage: 'test',
      inputTokens: 8200,
      outputTokens: 2100,
      cost: 0.05,
      duration: '1m 02s',
      model: task.model,
    },
    {
      stage: 'pr',
      inputTokens: 4800,
      outputTokens: 1600,
      cost: 0.03,
      duration: '0m 10s',
      model: task.model,
    },
  ];

  const replay: ReplayStep[] = [
    {
      index: 1,
      stage: 'analysis',
      action: 'Clone repository',
      input: `git clone ${task.repo}`,
      output: 'Cloned 312 files (2.4MB)',
      model: task.model,
      tools: ['git'],
      duration: '23s',
      status: 'completed',
    },
    {
      index: 2,
      stage: 'analysis',
      action: 'Scan project structure',
      input: 'Analyze file tree, package.json, tsconfig.json',
      output:
        'TypeScript project, Express.js framework, Prisma ORM, 47 source files',
      model: task.model,
      tools: ['file_search', 'file_read'],
      duration: '1m 49s',
      status: 'completed',
    },
    {
      index: 3,
      stage: 'plan',
      action: 'Generate implementation plan',
      input: 'Task: Implement user authentication middleware',
      output:
        '5-step plan: 1) Create auth middleware 2) Add token verification 3) Update routes 4) Add tests 5) Create PR',
      model: task.model,
      tools: [],
      duration: '2m 25s',
      status: 'completed',
    },
    {
      index: 4,
      stage: 'implement',
      action: 'Create auth middleware',
      input: 'Step 1: Create src/middleware/auth.ts',
      output:
        'Created file with JWT verification using jose library (142 lines)',
      model: task.model,
      tools: ['file_write'],
      duration: '2m 15s',
      status: 'completed',
    },
    {
      index: 5,
      stage: 'implement',
      action: 'Create token verifier',
      input: 'Step 2: Create src/middleware/token-verify.ts',
      output: 'Created utility module for token operations (87 lines)',
      model: task.model,
      tools: ['file_write'],
      duration: '1m 30s',
      status: 'completed',
    },
    {
      index: 6,
      stage: 'implement',
      action: 'Update routes',
      input: 'Step 3: Modify src/routes/index.ts',
      output: 'Added auth middleware to protected routes (+8 -2)',
      model: task.model,
      tools: ['file_edit'],
      duration: '0m 45s',
      status: 'completed',
    },
    {
      index: 7,
      stage: 'implement',
      action: 'Fix compilation error',
      input: 'TS2345: Type mismatch in auth.ts:42',
      output: 'Fixed JWTPayload type assertion',
      model: task.model,
      tools: ['file_edit'],
      duration: '2m 15s',
      status: 'completed',
    },
    {
      index: 8,
      stage: 'test',
      action: 'Run test suite',
      input: 'npm test',
      output: '12 passed, 0 failed',
      model: task.model,
      tools: ['shell'],
      duration: '1m 02s',
      status: task.stages.test === 'failed' ? 'failed' : 'completed',
    },
    {
      index: 9,
      stage: 'pr',
      action: 'Create pull request',
      input: 'gh pr create',
      output: 'PR #142 created: feat: add auth middleware',
      model: task.model,
      tools: ['shell'],
      duration: '10s',
      status:
        task.stages.pr === 'pending'
          ? 'skipped'
          : task.stages.pr === 'completed'
            ? 'completed'
            : 'skipped',
    },
  ];

  const healthAlerts: HealthAlert[] = [];
  let riskLevel: TaskDetail['health']['riskLevel'] = 'low';
  const missingSteps: string[] = [];

  if (task.badges.includes('path_deviation')) {
    healthAlerts.push({
      type: 'path_deviation',
      severity: 'warning',
      message: 'Agent deviated from planned implementation path',
    });
    riskLevel = 'medium';
  }
  if (task.stages.test === 'failed') {
    healthAlerts.push({
      type: 'test_failure',
      severity: 'critical',
      message: `${task.id === 'task-007' ? '2' : '1'} test failure(s) occurred`,
    });
    riskLevel = 'high';
  }
  if (task.status === 'blocked') {
    healthAlerts.push({
      type: 'blocked',
      severity: 'warning',
      message: 'Execution blocked — requires human decision',
    });
    if (riskLevel === 'low') riskLevel = 'medium';
  }
  if (task.status === 'failed') {
    healthAlerts.push({
      type: 'error',
      severity: 'critical',
      message: 'Task execution failed',
    });
    riskLevel = 'critical';
  }
  // Simulate a missing "design review" step for some tasks
  if (task.id === 'task-004' || task.id === 'task-002') {
    healthAlerts.push({
      type: 'missing_step',
      severity: 'warning',
      message: 'Missing step: design review',
    });
    missingSteps.push('design review');
  }

  return {
    task,
    timeline,
    logs,
    diff,
    cost,
    replay,
    health: {
      riskLevel,
      alerts: healthAlerts,
      expectedPath: ['analysis', 'plan', 'implement', 'test', 'pr'],
      actualPath: task.badges.includes('path_deviation')
        ? ['analysis', 'plan', 'implement', 'test']
        : ['analysis', 'plan', 'implement', 'test', 'pr'],
      missingSteps,
    },
    summary: {
      description:
        'Implement JWT-based authentication middleware for Express.js API with role-based access control.',
      issue: 'ACME-1234',
      contextFiles: [
        'src/routes/index.ts',
        'src/types/express.d.ts',
        'package.json',
      ],
      outputs: [
        'src/middleware/auth.ts',
        'src/middleware/token-verify.ts',
        'src/routes/index.ts (modified)',
      ],
      prUrl: 'https://github.com/acme/backend-api/pull/142',
      testsPassed: task.stages.test === 'failed' ? 10 : 12,
      testsFailed: task.stages.test === 'failed' ? 2 : 0,
      confidence:
        task.status === 'failed'
          ? 23
          : task.status === 'blocked'
            ? 62
            : task.badges.includes('path_deviation')
              ? 71
              : 87,
      pathDeviation: task.badges.includes('path_deviation'),
      errorCount:
        task.status === 'failed'
          ? 3
          : task.stages.test === 'failed'
            ? 2
            : task.badges.includes('path_deviation')
              ? 1
              : 0,
      retryCount:
        task.status === 'failed'
          ? 2
          : task.badges.includes('path_deviation')
            ? 1
            : 0,
      totalTokens: 76150,
      totalCost: task.cost,
    },
    approvals:
      task.status === 'blocked' || task.status === 'needs_review'
        ? [
            {
              id: 'appr-001',
              type: 'Implementation change',
              status: 'pending',
              description:
                task.status === 'blocked'
                  ? 'Agent requires schema change approval to proceed with batch loading optimization.'
                  : 'Implementation complete — review generated code and approve to create PR.',
              timestamp: '2026-04-06T10:33:00Z',
            },
          ]
        : [
            {
              id: 'appr-001',
              type: 'Plan approval',
              status: 'approved',
              description: '5-step implementation plan approved',
              timestamp: '2026-04-06T10:27:40Z',
            },
          ],
  };
}

export const MOCK_TASK_DETAILS: Record<string, TaskDetail> = Object.fromEntries(
  MOCK_TASKS.map((task) => [task.id, buildTaskDetail(task)])
);
