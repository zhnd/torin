// Loop caps for the resolve-defect workflow.

export const MAX_ANALYSIS_ROUNDS = 5;
export const MAX_REVIEW_ROUNDS = 5;

// Phase 2b: Best-of-N sampling. N candidates are generated sequentially
// in the same sandbox (reset between each); the top-1 by critic score is
// forwarded to HITL. Failed samples still feed memos into later samples,
// so the agent learns across them.
export const IMPLEMENT_SAMPLES = 3;
