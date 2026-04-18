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

export interface ResolveDefectInput {
  taskId: string;
  projectId: string;
  repositoryUrl: string;
  defectDescription: string;
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

/**
 * Risk class drives HITL policy:
 *   trivial — docs/comments/i18n/strings only; potentially auto-approvable
 *   low     — isolated single-point change
 *   medium  — cross-file logic change
 *   high    — touches core module / data model / auth / public API
 */
export type RiskClass = 'trivial' | 'low' | 'medium' | 'high';

/**
 * Front-end framework detected in the repo. Drives preview/boot-verify logic.
 */
export type WebFramework =
  | 'next'
  | 'vite'
  | 'astro'
  | 'remix'
  | 'vue'
  | 'svelte'
  | 'other';

export interface DefectAnalysis {
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

  // Environment / project signals that shape downstream phases.
  hasTestInfra: boolean;
  testFrameworks: string[];
  hasWebUI: boolean;
  webFramework?: WebFramework;
  devServerCommand?: string;

  // Policy + enforcement signals.
  riskClass: RiskClass;
  /** Canonical list of files allowed to change. Workflow enforces this. */
  scopeDeclaration: string[];
  expectedDiffSize: 'small' | 'medium' | 'large';

  /**
   * When automated verification is impossible (no tests, no verify script
   * feasible), surface explicit steps for the human reviewer to check.
   */
  verificationSteps?: string[];
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

/**
 * Oracle produced by the REPRODUCE phase. `mode` selects how FILTER runs it.
 *   test-framework — a proper test in the project's existing framework
 *   verify-script  — a standalone executable at .torin/verify.<ext>
 *   boot-verify    — web: start dev server, watch for clean boot + no errors
 *   none           — no oracle could be produced; HITL is the only validator
 */
export type OracleMode =
  | 'test-framework'
  | 'verify-script'
  | 'boot-verify'
  | 'none';

export interface ReproductionOracle {
  mode: OracleMode;
  /** Command that FILTER should run. Empty for mode 'none'. */
  runCommand: string;
  /** Path of the file that was written (test / verify script). */
  filePath?: string;
  /** Full content of what was written, for PR body display. */
  content?: string;
  /** Test framework name when mode is 'test-framework'. */
  framework?: string;
  /** True when the agent actually observed the oracle fail on HEAD. */
  confirmedFailing: boolean;
  /** Free-text reason when mode is 'none'. */
  skipReason?: string;
}

export interface FilterCheckResult {
  name: string;
  passed: boolean;
  durationMs: number;
  output?: string;
}

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

export interface ResolutionResult {
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

  /** Oracle produced by REPRODUCE, if any. */
  reproductionOracle?: ReproductionOracle;
  /** Per-check outcomes from FILTER. */
  filterChecks?: Record<string, FilterCheckResult>;
  /** Dev server URL for HITL to click through, when web project. */
  previewUrl?: string;
  /** True when riskClass was trivial and HITL was bypassed. */
  autoApproved: boolean;
}

export interface PullRequestResult {
  url: string;
  number: number;
}

export interface ReviewDecision {
  action: 'approve' | 'reject';
  feedback?: string;
}
