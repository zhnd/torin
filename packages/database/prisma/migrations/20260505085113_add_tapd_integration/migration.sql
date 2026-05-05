-- AlterTable
ALTER TABLE "task" ALTER COLUMN "input" DROP DEFAULT;

-- CreateTable
CREATE TABLE "tapd_credential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedSecret" TEXT NOT NULL,
    "tapdNick" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tapd_credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tapd_workspace_project_map" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tapd_workspace_project_map_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tapd_credential_userId_key" ON "tapd_credential"("userId");

-- CreateIndex
CREATE INDEX "tapd_workspace_project_map_projectId_idx" ON "tapd_workspace_project_map"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "tapd_workspace_project_map_userId_workspaceId_key" ON "tapd_workspace_project_map"("userId", "workspaceId");

-- AddForeignKey
ALTER TABLE "tapd_credential" ADD CONSTRAINT "tapd_credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tapd_workspace_project_map" ADD CONSTRAINT "tapd_workspace_project_map_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tapd_workspace_project_map" ADD CONSTRAINT "tapd_workspace_project_map_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
