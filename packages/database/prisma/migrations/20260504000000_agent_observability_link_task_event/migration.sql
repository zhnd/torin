-- Phase 1 agent observability: link AgentInvocation directly to its
-- parent STAGE TaskEvent. The 3 lifecycle tables (workflow_execution /
-- stage_execution / attempt_execution) remain in the schema but are no
-- longer written to under the event-driven model. attemptExecutionId is
-- relaxed to nullable so new rows can omit it.
--
-- Also adds a unique constraint on (agentInvocationId, toolUseId) so the
-- persist activity can safely retry without producing duplicate ToolCall
-- rows when Temporal re-runs it.

-- 1. New FK column from agent_invocation to task_event
ALTER TABLE "agent_invocation"
  ADD COLUMN "taskEventId" TEXT;

ALTER TABLE "agent_invocation"
  ADD CONSTRAINT "agent_invocation_taskEventId_fkey"
  FOREIGN KEY ("taskEventId") REFERENCES "task_event"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "agent_invocation_taskEventId_idx"
  ON "agent_invocation"("taskEventId");

-- 2. Relax legacy lifecycle FK (was NOT NULL)
ALTER TABLE "agent_invocation"
  ALTER COLUMN "attemptExecutionId" DROP NOT NULL;

-- 3. Idempotency for tool_call retries
ALTER TABLE "tool_call"
  ADD CONSTRAINT "tool_call_agentInvocationId_toolUseId_key"
  UNIQUE ("agentInvocationId", "toolUseId");
