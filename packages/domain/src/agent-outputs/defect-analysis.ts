import { z } from 'zod/v4';

/**
 * Risk class drives HITL policy:
 *   trivial — docs/comments/i18n/strings only; potentially auto-approvable
 *   low     — isolated single-point change
 *   medium  — cross-file logic change
 *   high    — touches core module / data model / auth / public API
 */
export const riskClassSchema = z.enum(['trivial', 'low', 'medium', 'high']);
export type RiskClass = z.infer<typeof riskClassSchema>;

/**
 * Front-end framework detected in the repo. Drives preview/boot-verify logic.
 */
export const webFrameworkSchema = z.enum([
  'next',
  'vite',
  'astro',
  'remix',
  'vue',
  'svelte',
  'other',
]);
export type WebFramework = z.infer<typeof webFrameworkSchema>;

export const investigationStepSchema = z.object({
  file: z.string(),
  finding: z.string(),
});
export type InvestigationStep = z.infer<typeof investigationStepSchema>;

export const evidenceSchema = z.object({
  file: z.string(),
  lines: z.string(),
  code: z.string(),
  explanation: z.string(),
});
export type Evidence = z.infer<typeof evidenceSchema>;

/**
 * Output of the analyze-defect agent. Boundary schema — do not add
 * fields here without also updating the agent's prompt.
 */
export const defectAnalysisSchema = z.object({
  rootCause: z.string(),
  affectedFiles: z.array(z.string()),
  proposedApproach: z.string(),
  relevantContext: z.string(),
  testStrategy: z.string(),
  investigation: z.array(investigationStepSchema),
  evidence: z.array(evidenceSchema),
  confidence: z.enum(['high', 'medium', 'low']),
  riskAssessment: z.string(),
  alternatives: z.array(z.string()).optional(),

  // Environment / project signals that shape downstream phases.
  hasTestInfra: z.boolean(),
  testFrameworks: z.array(z.string()),
  hasWebUI: z.boolean(),
  webFramework: webFrameworkSchema.optional(),
  devServerCommand: z.string().optional(),

  // Policy + enforcement signals.
  riskClass: riskClassSchema,
  /** Canonical list of files allowed to change. Workflow enforces this. */
  scopeDeclaration: z.array(z.string()),
  expectedDiffSize: z.enum(['small', 'medium', 'large']),

  /**
   * When automated verification is impossible (no tests, no verify script
   * feasible), surface explicit steps for the human reviewer to check.
   */
  verificationSteps: z.array(z.string()).optional(),
});

export type DefectAnalysis = z.infer<typeof defectAnalysisSchema>;
