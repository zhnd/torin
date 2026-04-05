-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ANALYZE_REPOSITORY',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "repositoryUrl" TEXT NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "workflowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);
