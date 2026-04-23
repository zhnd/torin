export interface ApiProject {
  id: string;
  name: string;
  repositoryUrl: string;
  authMethod: string;
  updatedAt: string;
}

export interface ProjectCardData {
  id: string;
  name: string;
  repositoryUrl: string;
  authMethod?: string;
  updatedAt: string;
  taskCount?: number;
  openCount?: number;
  runningCount?: number;
  awaitingCount?: number;
  successRate?: number | null;
  trend?: number[];
  lang?: string;
}
