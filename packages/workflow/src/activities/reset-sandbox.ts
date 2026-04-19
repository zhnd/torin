import { connectSandbox, type SandboxState } from '@torin/sandbox';
import { log } from '../logger.js';

export interface ResetSandboxInput {
  state: SandboxState;
  /**
   * Optional base branch. If omitted, the activity detects the default
   * branch via `git symbolic-ref refs/remotes/origin/HEAD`.
   */
  baseBranch?: string;
  /** If true, also delete any `fix/*` branches. Default: true. */
  deleteFixBranches?: boolean;
}

export interface ResetSandboxResult {
  baseBranch: string;
}

/**
 * Reset the sandbox working tree between Best-of-N samples so sample
 * k+1 starts from a clean base:
 *   1. Detect (or use provided) base branch
 *   2. checkout it + reset --hard origin/<base>
 *   3. delete stale `fix/*` branches (best-effort)
 *
 * Auto-detects baseBranch so callers don't need to thread it through.
 */
export async function resetSandboxActivity(
  input: ResetSandboxInput
): Promise<ResetSandboxResult> {
  const sandbox = await connectSandbox(input.state);

  let baseBranch = input.baseBranch;
  if (!baseBranch) {
    const detect = await sandbox.exec(
      "git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo main",
      { timeoutMs: 10_000 }
    );
    baseBranch = detect.stdout.trim() || 'main';
  }

  log.info({ baseBranch }, 'Resetting sandbox');

  const checkout = await sandbox.exec(
    `git checkout ${shellArg(baseBranch)} && git reset --hard origin/${shellArg(baseBranch)}`,
    { timeoutMs: 30_000 }
  );
  if (!checkout.success) {
    throw new Error(
      `Reset failed during checkout/reset: ${checkout.stderr || checkout.stdout}`
    );
  }

  if (input.deleteFixBranches !== false) {
    await sandbox.exec(
      `git for-each-ref --format='%(refname:short)' refs/heads/fix/ | xargs -r git branch -D 2>/dev/null || true`,
      { timeoutMs: 10_000 }
    );
  }

  log.info({ baseBranch }, 'Sandbox reset complete');
  return { baseBranch };
}

function shellArg(input: string): string {
  return `'${input.replace(/'/g, `'\\''`)}'`;
}
