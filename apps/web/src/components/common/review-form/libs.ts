import type { LaneMeta } from './types';

export function hasMinFeedback(lane: LaneMeta | null, feedback: string): boolean {
  if (!lane?.required) return true;
  return feedback.trim().length >= (lane.minChars ?? 1);
}
