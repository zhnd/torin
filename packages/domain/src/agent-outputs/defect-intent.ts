import { z } from 'zod/v4';

/**
 * Coarse classification used to route downstream behavior (e.g.
 * 'ui-rendering' biases the analyze agent toward looking at component
 * tree / CSS modules; 'config' biases it toward dotfiles and env).
 * Default to 'unclear' when the report is too vague.
 */
export const defectTypeSchema = z.enum([
  'functional-bug',
  'data-corruption',
  'regression',
  'ui-rendering',
  'performance',
  'crash',
  'config',
  'unclear',
]);
export type DefectType = z.infer<typeof defectTypeSchema>;

/**
 * Key term in the defect report worth grepping for. For Tapd inputs the
 * original is usually Chinese (UI label / error message / domain term)
 * and must NOT be translated away — it is the literal grep target in the
 * codebase (i18n keys, hardcoded strings). The optional translation
 * helps cross-reference English identifiers when applicable.
 */
export const defectKeyTermSchema = z.object({
  original: z.string(),
  translation: z.string().optional(),
  kind: z
    .enum(['ui-label', 'error-message', 'identifier', 'concept', 'other'])
    .optional(),
});
export type DefectKeyTerm = z.infer<typeof defectKeyTermSchema>;

/**
 * One "if this is the cause, here is how to confirm" hypothesis paired
 * with concrete greppable queries. The analyze agent runs these as its
 * first turns instead of doing open-ended exploration.
 */
export const defectSearchHypothesisSchema = z.object({
  hypothesis: z.string(),
  queries: z.array(z.string()).min(1),
});
export type DefectSearchHypothesis = z.infer<
  typeof defectSearchHypothesisSchema
>;

/**
 * Output of the triage-defect-intent agent. Pure text-driven reasoning
 * over the raw defect description — no sandbox access. Designed to be
 * reused as a constraint by the downstream analyze agent
 * (SpecRover-style spec-as-shared-artifact).
 *
 * `unknowns` is intentionally required (and may be a non-empty array)
 * to prevent the LLM from hallucinating missing fields — terse Tapd
 * reports often lack expected/actual/repro info, and the agent must
 * own up to it rather than invent.
 */
export const defectIntentSchema = z.object({
  summary: z.string(),
  expectedBehavior: z.string().nullable(),
  actualBehavior: z.string().nullable(),
  defectType: defectTypeSchema,
  keyTerms: z.array(defectKeyTermSchema),
  searchHypotheses: z.array(defectSearchHypothesisSchema),
  reproducerHypothesis: z.string().nullable(),
  unknowns: z.array(z.string()),
});

export type DefectIntent = z.infer<typeof defectIntentSchema>;
