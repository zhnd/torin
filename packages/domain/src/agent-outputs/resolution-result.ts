import { z } from 'zod/v4';
import { reproductionOracleSchema } from './reproduction-oracle';

export const fileChangeSchema = z.object({
  file: z.string(),
  description: z.string(),
});
export type FileChange = z.infer<typeof fileChangeSchema>;

export const fileDiffSchema = z.object({
  file: z.string(),
  reason: z.string(),
  additions: z.number(),
  deletions: z.number(),
  patch: z.string(),
});
export type FileDiff = z.infer<typeof fileDiffSchema>;

export const filterCheckResultSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  durationMs: z.number(),
  output: z.string().optional(),
});
export type FilterCheckResult = z.infer<typeof filterCheckResultSchema>;

/**
 * Output of the implement-resolution agent. Boundary schema — do not add
 * fields here without also updating the agent's prompt.
 *
 * `autoApproved` is populated by the workflow (not the agent); it defaults
 * to false so that schema validation passes on the agent's raw output.
 */
export const resolutionResultSchema = z.object({
  branch: z.string(),
  baseBranch: z.string(),
  commitSha: z.string(),
  summary: z.string(),
  filesChanged: z.array(z.string()),
  testsPassed: z.boolean(),
  testOutput: z.string().optional(),
  changes: z.array(fileChangeSchema),
  diff: z.array(fileDiffSchema),
  reviewNotes: z.string(),
  breakingChanges: z.string().optional(),

  /** Oracle produced by REPRODUCE, if any. */
  reproductionOracle: reproductionOracleSchema.optional(),
  /** Per-check outcomes from FILTER. */
  filterChecks: z.record(z.string(), filterCheckResultSchema).optional(),
  /** Dev server URL for HITL to click through, when web project. */
  previewUrl: z.string().optional(),
  /** True when riskClass was trivial and HITL was bypassed. */
  autoApproved: z.boolean().default(false),
});

export type ResolutionResult = z.infer<typeof resolutionResultSchema>;
