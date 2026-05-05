export interface TapdBugRow {
  id: string;
  workspaceId: string;
  workspaceName: string | null;
  title: string;
  description: string;
  status: string;
  priority: string | null;
  currentOwner: string | null;
  url: string;
  createdAt: string;
}

export interface TapdInboxStatus {
  configured: boolean;
  tapdNick: string | null;
}

export interface TapdProjectRef {
  id: string;
  name: string;
  repositoryUrl: string;
}

export interface TapdInboxMapping {
  workspaceId: string;
  projectId: string;
  project: {
    id: string;
    name: string;
    repositoryUrl: string;
  };
}

export interface TapdInboxData {
  tapdCredentialStatus: TapdInboxStatus;
  tapdAssignedBugs: TapdBugRow[];
  tapdWorkspaceMappings: TapdInboxMapping[];
  projects: TapdProjectRef[];
}

export interface ProjectBranchesData {
  projectBranches: string[];
}
