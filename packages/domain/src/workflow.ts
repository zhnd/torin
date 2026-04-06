export interface AnalyzeRepositoryInput {
  taskId: string;
  repositoryUrl: string;
}

export interface AnalysisResult {
  summary: string;
  techStack: string[];
  patterns: string[];
  structure: string;
  recommendations: string[];
}

export interface FixBugInput {
  taskId: string;
  projectId: string;
  repositoryUrl: string;
  bugDescription: string;
}

export interface InvestigationStep {
  file: string;
  finding: string;
}

export interface Evidence {
  file: string;
  lines: string;
  code: string;
  explanation: string;
}

export interface BugAnalysis {
  rootCause: string;
  affectedFiles: string[];
  proposedApproach: string;
  relevantContext: string;
  testStrategy: string;
  investigation: InvestigationStep[];
  evidence: Evidence[];
  confidence: 'high' | 'medium' | 'low';
  riskAssessment: string;
  alternatives?: string[];
}

export interface FileChange {
  file: string;
  description: string;
}

export interface FileDiff {
  file: string;
  reason: string;
  additions: number;
  deletions: number;
  patch: string;
}

export interface FixResult {
  branch: string;
  baseBranch: string;
  commitSha: string;
  summary: string;
  filesChanged: string[];
  testsPassed: boolean;
  testOutput?: string;
  changes: FileChange[];
  diff: FileDiff[];
  reviewNotes: string;
  breakingChanges?: string;
}

export interface PullRequestResult {
  url: string;
  number: number;
}

export interface ReviewDecision {
  action: 'approve' | 'reject';
  feedback?: string;
}
