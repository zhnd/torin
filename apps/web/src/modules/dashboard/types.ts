export interface DashboardProject {
  id: string;
  name: string;
  repositoryUrl?: string;
}

export interface DashboardTask {
  id: string;
  status: string;
  type: string;
  currentStageKey: string | null;
  awaiting: { stageKey: string; attemptNumber: number } | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string } | null;
}
