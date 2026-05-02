/**
 * Compute the position (within a unified diff hunk) of the first added line.
 * GitHub uses this position for inline review comments.
 */
export function firstAddedLinePosition(patch: string): number | null {
  const lines = patch.split('\n');
  let position = 0;
  for (let i = 0; i < lines.length; i++) {
    position++;
    if (lines[i].startsWith('+') && !lines[i].startsWith('+++')) {
      return position;
    }
  }
  return null;
}

/**
 * Compute the **new-file line number** of the first added line in a unified
 * diff. cnb.cool's review-comment API takes start_line/end_line in the new
 * file, not a diff-relative position.
 *
 * Reads the `@@ -a,b +c,d @@` hunk headers to track the current new-file
 * line, increments on context (` `) and added (`+`) lines, skips removed
 * (`-`) lines.
 */
export function firstAddedLineNumber(patch: string): number | null {
  const lines = patch.split('\n');
  const hunkRe = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/;
  let newLine = 0;
  let inHunk = false;
  for (const line of lines) {
    const hunk = line.match(hunkRe);
    if (hunk) {
      newLine = Number.parseInt(hunk[1], 10);
      inHunk = true;
      continue;
    }
    if (!inHunk) continue;
    if (line.startsWith('+++')) continue;
    if (line.startsWith('+')) return newLine;
    if (line.startsWith('-')) continue;
    // context line
    newLine++;
  }
  return null;
}
