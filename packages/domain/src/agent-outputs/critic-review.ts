import { z } from 'zod/v4';

export const criticConcernSchema = z.object({
  severity: z.enum(['blocking', 'warning', 'info']),
  description: z.string(),
  file: z.string().optional(),
  suggestion: z.string().optional(),
});
export type CriticConcern = z.infer<typeof criticConcernSchema>;

/**
 * Output of the critic-resolution agent. Adversarial review produced
 * between FILTER (passed automated checks) and HITL review — surfaces
 * concerns a test suite can't catch.
 *
 * Invariant enforced in the agent wrapper, not here:
 *   - scopeAssessment === 'out-of-scope' → approve = false
 *   - any concern with severity 'blocking' → approve = false
 */
export const criticReviewSchema = z.object({
  /** True when the critic believes the patch is ready for HITL review. */
  approve: z.boolean(),
  /** Quality score 0..1; used when ranking Best-of-N candidates. */
  score: z.number(),
  concerns: z.array(criticConcernSchema),
  scopeAssessment: z.enum(['clean', 'ambiguous', 'out-of-scope']),
});

export type CriticReview = z.infer<typeof criticReviewSchema>;
