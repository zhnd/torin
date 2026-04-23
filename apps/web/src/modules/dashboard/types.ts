export interface DashboardProject {
  id: string;
  name: string;
  repositoryUrl?: string;
}

export interface DashboardTask {
  id: string;
  status: string;
  currentStage: string | null;
  totalCostUsd: number | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string } | null;
  type: string;
}
