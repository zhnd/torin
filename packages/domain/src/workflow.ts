import type {
  FileChange,
  FileDiff,
  FilterCheckResult,
} from './agent-outputs/resolution-result';

export interface AnalyzeRepositoryInput {
  taskId: string;
  repositoryUrl: string;
}

export interface ResolveDefectInput {
  taskId: string;
  projectId: string;
  repositoryUrl: string;
  defectDescription: string;
}

/**
 * One candidate from the Best-of-N IMPLEMENT loop. Produced by the
 * workflow (scope check + filter), not directly by any LLM — so it is
 * a plain interface, not a zod schema.
 */
export interface CandidatePatch {
  sampleId: number;
  branch: string;
  commitSha: string;
  diff: FileDiff[];
  changes: FileChange[];
  filesChanged: string[];
  scopeClean: boolean;
  scopeViolations: string[];
  oracleCheck?: FilterCheckResult;
  regressionCheck?: FilterCheckResult;
  buildCheck?: FilterCheckResult;
  lintCheck?: FilterCheckResult;
  bootCheck?: FilterCheckResult;
  previewUrl?: string;
  overallPassed: boolean;
}

export interface PullRequestResult {
  url: string;
  number: number;
}

export interface ReviewDecision {
  action: 'approve' | 'reject';
  /** Freeform reviewer comment. */
  feedback?: string;
}
