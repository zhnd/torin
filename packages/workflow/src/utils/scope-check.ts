const LOCKFILE_NAMES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'Cargo.lock',
  'go.sum',
  'uv.lock',
  'poetry.lock',
  'Pipfile.lock',
]);

export interface ScopeCheckResult {
  clean: boolean;
  outOfScope: string[];
  unauthorizedLockfiles: string[];
}

/**
 * Verify that all files modified by an implement attempt are allowed.
 * Lockfiles get a special veto — they're never implicitly in scope, even if
 * the agent declares them, because silent dependency changes are too risky.
 * To intentionally upgrade a dep, the caller must pass `allowLockfiles`.
 */
export function checkScope(
  modifiedFiles: string[],
  declaration: string[],
  extras: { reproTestFile?: string; allowLockfiles?: boolean } = {}
): ScopeCheckResult {
  const allowed = new Set(declaration);
  if (extras.reproTestFile) allowed.add(extras.reproTestFile);

  const outOfScope: string[] = [];
  const unauthorizedLockfiles: string[] = [];

  for (const file of modifiedFiles) {
    const basename = file.split('/').pop() ?? '';
    const isLockfile = LOCKFILE_NAMES.has(basename);

    if (isLockfile && !extras.allowLockfiles) {
      unauthorizedLockfiles.push(file);
      continue;
    }
    if (!allowed.has(file)) {
      outOfScope.push(file);
    }
  }

  return {
    clean: outOfScope.length === 0 && unauthorizedLockfiles.length === 0,
    outOfScope,
    unauthorizedLockfiles,
  };
}

export function formatScopeFeedback(result: ScopeCheckResult): string {
  const lines: string[] = [
    'Your last attempt modified files outside the allowed scope.',
  ];
  if (result.outOfScope.length > 0) {
    lines.push('', 'Out-of-scope files:');
    for (const f of result.outOfScope) lines.push(`  - ${f}`);
  }
  if (result.unauthorizedLockfiles.length > 0) {
    lines.push('', 'Unauthorized lockfile changes:');
    for (const f of result.unauthorizedLockfiles) lines.push(`  - ${f}`);
    lines.push(
      '',
      'Lockfile changes are not allowed unless dependency upgrades were ' +
        'explicitly part of the approved approach.'
    );
  }
  lines.push('', 'Revert those edits and retry with only the declared scope.');
  return lines.join('\n');
}
