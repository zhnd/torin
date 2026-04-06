-- AlterTable
ALTER TABLE "task" ADD COLUMN     "costBreakdown" JSONB,
ADD COLUMN     "currentStage" TEXT,
ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "outputTokens" INTEGER,
ADD COLUMN     "stages" JSONB,
ADD COLUMN     "totalCostUsd" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "task_event" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "agent" TEXT,
    "tool" TEXT,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_event_taskId_timestamp_idx" ON "task_event"("taskId", "timestamp");

-- AddForeignKey
ALTER TABLE "task_event" ADD CONSTRAINT "task_event_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
