export type DetailTab = 'overview' | 'tasks' | 'settings';

export interface ProjectTask {
  id: string;
  type: string;
  status: string;
  repositoryUrl: string;
  createdAt: string;
}

export interface ProjectDetailData {
  id: string;
  name: string;
  repositoryUrl: string;
  authMethod: string;
  hasCredentials: boolean;
  previewCommand?: string | null;
  previewPort?: number | null;
  previewReadyPattern?: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: ProjectTask[];
}
