import type { DiffFile } from './types';

/**
 * Build a unified-diff patch string for a single file. Pierre's
 * PatchDiff parses standard unified-diff headers, so we synthesize
 * `--- a/path` / `+++ b/path` lines around the bare hunk text from the
 * agent's `result.diff` array. If the patch already carries a header
 * (some agents include it), pass through unchanged.
 */
export function buildPatchForFile(file: DiffFile): string {
  const hasHeader = /^---\s/m.test(file.patch);
  if (hasHeader) return file.patch;
  return `--- a/${file.file}\n+++ b/${file.file}\n${file.patch}`;
}
