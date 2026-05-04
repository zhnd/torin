export interface InboxTask {
  id: string;
  status: string;
  type: string;
  currentStageKey: string | null;
  awaiting: { stageKey: string; attemptNumber: number } | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string } | null;
}

export interface AwaitingItem {
  id: string;
  title: string;
  projectName: string;
  stage: string;
  risk: string;
  waited: string;
  waitedMinutes: number;
  branch: string;
}

export interface DecisionItem {
  taskId: string;
  projectName: string;
  stage: string;
  decision: string;
  time: string;
}
