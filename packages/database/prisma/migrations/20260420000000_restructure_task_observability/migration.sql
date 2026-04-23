-- This migration is authored idempotently so a partial failure can be
-- recovered by simply re-running `prisma migrate deploy`. CREATE TYPE /
-- CREATE TABLE / ADD COLUMN / ADD CONSTRAINT / CREATE INDEX all guard on
-- existence.

-- ── Enums ─────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuthProvider') THEN
    CREATE TYPE "AuthProvider" AS ENUM ('GITHUB', 'GITLAB', 'GITEA');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaskType') THEN
    CREATE TYPE "TaskType" AS ENUM ('ANALYZE_REPOSITORY', 'RESOLVE_DEFECT');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaskStatus') THEN
    CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'RUNNING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExecutionStatus') THEN
    CREATE TYPE "ExecutionStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StageStatus') THEN
    CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'RUNNING', 'AWAITING', 'COMPLETED', 'FAILED', 'SKIPPED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgentInvocationStatus') THEN
    CREATE TYPE "AgentInvocationStatus" AS ENUM ('RUNNING', 'SUCCESS', 'ERROR');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DecisionType') THEN
    CREATE TYPE "DecisionType" AS ENUM ('BINARY', 'TERNARY');
  END IF;
END $$;

-- ── Project: add authProvider + workflowConfig ────────────────
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "authProvider" "AuthProvider" NOT NULL DEFAULT 'GITHUB';
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "workflowConfig" JSONB;

-- ── Task: normalize legacy values + convert to enums ──────────
-- Skip normalization if already migrated (column type is enum, not text).
DO $$
DECLARE
  task_type_is_text boolean;
BEGIN
  SELECT data_type = 'text' INTO task_type_is_text
  FROM information_schema.columns
  WHERE table_name = 'task' AND column_name = 'type';

  IF task_type_is_text THEN
    -- Legacy FIX_BUG → RESOLVE_DEFECT; any unknown → ANALYZE_REPOSITORY.
    UPDATE "task" SET "type" = 'RESOLVE_DEFECT' WHERE "type" = 'FIX_BUG';
    UPDATE "task" SET "type" = 'ANALYZE_REPOSITORY'
      WHERE "type" NOT IN ('ANALYZE_REPOSITORY', 'RESOLVE_DEFECT');
    UPDATE "task" SET "status" = 'PENDING'
      WHERE "status" NOT IN ('PENDING', 'RUNNING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED');

    ALTER TABLE "task"
      ALTER COLUMN "type" DROP DEFAULT,
      ALTER COLUMN "type" TYPE "TaskType" USING "type"::"TaskType",
      ALTER COLUMN "type" SET DEFAULT 'ANALYZE_REPOSITORY',
      ALTER COLUMN "status" DROP DEFAULT,
      ALTER COLUMN "status" TYPE "TaskStatus" USING "status"::"TaskStatus",
      ALTER COLUMN "status" SET DEFAULT 'PENDING';
  END IF;
END $$;

-- ── TaskEvent: add typed-event columns, relax legacy NOT NULLs ─
ALTER TABLE "task_event" ADD COLUMN IF NOT EXISTS "attemptExecutionId" TEXT;
ALTER TABLE "task_event" ADD COLUMN IF NOT EXISTS "eventType" TEXT NOT NULL DEFAULT 'Log';
ALTER TABLE "task_event" ADD COLUMN IF NOT EXISTS "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "task_event" ADD COLUMN IF NOT EXISTS "payload" JSONB;
ALTER TABLE "task_event" ADD COLUMN IF NOT EXISTS "spanId" TEXT;
ALTER TABLE "task_event" ADD COLUMN IF NOT EXISTS "stageExecutionId" TEXT;
ALTER TABLE "task_event" ADD COLUMN IF NOT EXISTS "traceId" TEXT;
ALTER TABLE "task_event" ADD COLUMN IF NOT EXISTS "workflowExecutionId" TEXT;
ALTER TABLE "task_event" ALTER COLUMN "stage" DROP NOT NULL;
ALTER TABLE "task_event" ALTER COLUMN "event" DROP NOT NULL;
ALTER TABLE "task_event" ALTER COLUMN "level" DROP NOT NULL;
ALTER TABLE "task_event" ALTER COLUMN "level" DROP DEFAULT;

UPDATE "task_event" SET "occurredAt" = "timestamp"
  WHERE "occurredAt" IS DISTINCT FROM "timestamp" AND "timestamp" IS NOT NULL;

-- ── New tables ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "workflow_definition" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workflow_definition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "workflow_stage" (
    "id" TEXT NOT NULL,
    "workflowDefinitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "allowsRetry" BOOLEAN NOT NULL DEFAULT true,
    "allowsHitl" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    CONSTRAINT "workflow_stage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "workflow_execution" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workflowKind" TEXT NOT NULL,
    "workflowVersion" INTEGER NOT NULL DEFAULT 1,
    "traceId" TEXT NOT NULL,
    "temporalWorkflowId" TEXT,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    CONSTRAINT "workflow_execution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "stage_execution" (
    "id" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "spanId" TEXT NOT NULL,
    "parentSpanId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    CONSTRAINT "stage_execution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "attempt_execution" (
    "id" TEXT NOT NULL,
    "stageExecutionId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "triggerKind" TEXT NOT NULL,
    "triggerPayload" JSONB,
    "spanId" TEXT NOT NULL,
    "parentSpanId" TEXT NOT NULL,
    "status" "StageStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    CONSTRAINT "attempt_execution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "agent_invocation" (
    "id" TEXT NOT NULL,
    "attemptExecutionId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "AgentInvocationStatus" NOT NULL DEFAULT 'RUNNING',
    "errorText" TEXT,
    "spanId" TEXT NOT NULL,
    "parentSpanId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "totalCostUsd" DOUBLE PRECISION,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    CONSTRAINT "agent_invocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "agent_turn" (
    "id" TEXT NOT NULL,
    "agentInvocationId" TEXT NOT NULL,
    "turnIndex" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "textContent" TEXT,
    "textTruncatedAt" INTEGER,
    "toolUseCount" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_turn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tool_call" (
    "id" TEXT NOT NULL,
    "agentInvocationId" TEXT NOT NULL,
    "agentTurnId" TEXT,
    "toolUseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" TEXT,
    "outputTruncatedAt" INTEGER,
    "success" BOOLEAN,
    "errorText" TEXT,
    "spanId" TEXT NOT NULL,
    "parentSpanId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    CONSTRAINT "tool_call_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "resolution_sample" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "attemptExecutionId" TEXT NOT NULL,
    "sampleIndex" INTEGER NOT NULL,
    "branch" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "filesChanged" JSONB NOT NULL,
    "patch" TEXT NOT NULL,
    "additions" INTEGER NOT NULL DEFAULT 0,
    "deletions" INTEGER NOT NULL DEFAULT 0,
    "filterPassed" BOOLEAN NOT NULL DEFAULT false,
    "filterChecks" JSONB,
    "criticApproved" BOOLEAN,
    "criticScore" DOUBLE PRECISION,
    "criticConcerns" JSONB,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resolution_sample_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "human_review" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "stageExecutionId" TEXT NOT NULL,
    "decisionType" "DecisionType" NOT NULL DEFAULT 'BINARY',
    "action" TEXT NOT NULL,
    "feedback" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "human_review_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "retrospective" (
    "id" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "summary" TEXT,
    "bottlenecks" JSONB NOT NULL DEFAULT '[]',
    "recommendations" JSONB NOT NULL DEFAULT '[]',
    "riskFactors" JSONB NOT NULL DEFAULT '[]',
    "stats" JSONB NOT NULL DEFAULT '{}',
    "model" TEXT,
    "costUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "retrospective_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "task_result" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workflowKind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_result_pkey" PRIMARY KEY ("id")
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "workflow_definition_kind_key" ON "workflow_definition"("kind");
CREATE INDEX IF NOT EXISTS "workflow_stage_workflowDefinitionId_order_idx" ON "workflow_stage"("workflowDefinitionId", "order");
CREATE UNIQUE INDEX IF NOT EXISTS "workflow_stage_workflowDefinitionId_name_key" ON "workflow_stage"("workflowDefinitionId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "workflow_execution_traceId_key" ON "workflow_execution"("traceId");
CREATE INDEX IF NOT EXISTS "workflow_execution_taskId_idx" ON "workflow_execution"("taskId");
CREATE INDEX IF NOT EXISTS "workflow_execution_workflowKind_status_idx" ON "workflow_execution"("workflowKind", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "stage_execution_spanId_key" ON "stage_execution"("spanId");
CREATE INDEX IF NOT EXISTS "stage_execution_workflowExecutionId_order_idx" ON "stage_execution"("workflowExecutionId", "order");
CREATE UNIQUE INDEX IF NOT EXISTS "attempt_execution_spanId_key" ON "attempt_execution"("spanId");
CREATE UNIQUE INDEX IF NOT EXISTS "attempt_execution_stageExecutionId_attemptNumber_key" ON "attempt_execution"("stageExecutionId", "attemptNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "agent_invocation_spanId_key" ON "agent_invocation"("spanId");
CREATE INDEX IF NOT EXISTS "agent_invocation_attemptExecutionId_idx" ON "agent_invocation"("attemptExecutionId");
CREATE UNIQUE INDEX IF NOT EXISTS "agent_turn_agentInvocationId_turnIndex_key" ON "agent_turn"("agentInvocationId", "turnIndex");
CREATE UNIQUE INDEX IF NOT EXISTS "tool_call_spanId_key" ON "tool_call"("spanId");
CREATE INDEX IF NOT EXISTS "tool_call_agentInvocationId_startedAt_idx" ON "tool_call"("agentInvocationId", "startedAt");
CREATE INDEX IF NOT EXISTS "tool_call_name_idx" ON "tool_call"("name");
CREATE INDEX IF NOT EXISTS "resolution_sample_taskId_idx" ON "resolution_sample"("taskId");
CREATE INDEX IF NOT EXISTS "resolution_sample_attemptExecutionId_sampleIndex_idx" ON "resolution_sample"("attemptExecutionId", "sampleIndex");
CREATE INDEX IF NOT EXISTS "human_review_taskId_createdAt_idx" ON "human_review"("taskId", "createdAt");
CREATE INDEX IF NOT EXISTS "human_review_stageExecutionId_idx" ON "human_review"("stageExecutionId");
CREATE UNIQUE INDEX IF NOT EXISTS "retrospective_workflowExecutionId_key" ON "retrospective"("workflowExecutionId");
CREATE UNIQUE INDEX IF NOT EXISTS "task_result_taskId_key" ON "task_result"("taskId");
CREATE INDEX IF NOT EXISTS "task_status_idx" ON "task"("status");
CREATE INDEX IF NOT EXISTS "task_type_idx" ON "task"("type");
CREATE INDEX IF NOT EXISTS "task_event_taskId_occurredAt_idx" ON "task_event"("taskId", "occurredAt");
CREATE INDEX IF NOT EXISTS "task_event_eventType_idx" ON "task_event"("eventType");
CREATE INDEX IF NOT EXISTS "task_event_workflowExecutionId_idx" ON "task_event"("workflowExecutionId");

-- ── Foreign keys (DO blocks for idempotency) ──────────────────
DO $$ BEGIN
  ALTER TABLE "workflow_stage" ADD CONSTRAINT "workflow_stage_workflowDefinitionId_fkey" FOREIGN KEY ("workflowDefinitionId") REFERENCES "workflow_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "stage_execution" ADD CONSTRAINT "stage_execution_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "workflow_execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "attempt_execution" ADD CONSTRAINT "attempt_execution_stageExecutionId_fkey" FOREIGN KEY ("stageExecutionId") REFERENCES "stage_execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "agent_invocation" ADD CONSTRAINT "agent_invocation_attemptExecutionId_fkey" FOREIGN KEY ("attemptExecutionId") REFERENCES "attempt_execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "agent_turn" ADD CONSTRAINT "agent_turn_agentInvocationId_fkey" FOREIGN KEY ("agentInvocationId") REFERENCES "agent_invocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "tool_call" ADD CONSTRAINT "tool_call_agentInvocationId_fkey" FOREIGN KEY ("agentInvocationId") REFERENCES "agent_invocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "tool_call" ADD CONSTRAINT "tool_call_agentTurnId_fkey" FOREIGN KEY ("agentTurnId") REFERENCES "agent_turn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "task_event" ADD CONSTRAINT "task_event_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "workflow_execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "task_event" ADD CONSTRAINT "task_event_stageExecutionId_fkey" FOREIGN KEY ("stageExecutionId") REFERENCES "stage_execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "task_event" ADD CONSTRAINT "task_event_attemptExecutionId_fkey" FOREIGN KEY ("attemptExecutionId") REFERENCES "attempt_execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "resolution_sample" ADD CONSTRAINT "resolution_sample_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "resolution_sample" ADD CONSTRAINT "resolution_sample_attemptExecutionId_fkey" FOREIGN KEY ("attemptExecutionId") REFERENCES "attempt_execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "human_review" ADD CONSTRAINT "human_review_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "human_review" ADD CONSTRAINT "human_review_stageExecutionId_fkey" FOREIGN KEY ("stageExecutionId") REFERENCES "stage_execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "human_review" ADD CONSTRAINT "human_review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "retrospective" ADD CONSTRAINT "retrospective_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "workflow_execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "task_result" ADD CONSTRAINT "task_result_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
