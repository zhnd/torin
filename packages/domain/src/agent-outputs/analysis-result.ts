import { z } from 'zod/v4';

/**
 * Output of the analyze-repository agent. Boundary schema — do not add
 * fields here without also updating the agent's prompt.
 */
export const analysisResultSchema = z.object({
  summary: z.string(),
  techStack: z.array(z.string()),
  patterns: z.array(z.string()),
  structure: z.string(),
  recommendations: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
