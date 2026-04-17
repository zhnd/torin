import { createHash } from 'node:crypto';
import type { Sandbox } from '../interface.js';
import { DEFAULT_TOOLCHAIN_VERSIONS } from './defaults.js';

export interface SetupPlan {
  /** Shell commands to run inside the builder, in order. */
  commands: string[];
  /** Hash over the inputs that determined this plan; feeds the image cache key. */
  setupHash: string;
  /** Human-readable toolchain label, for logs. */
  toolchain: string;
  /** If true, no install was detected; caller can skip tier-2 entirely. */
  empty: boolean;
}

/**
 * Inspect the builder's filesystem and decide how to materialize dependencies.
 *
 * Priority order (first match wins):
 *   1. `mise.toml` or `.tool-versions` → let mise dictate the toolchain;
 *      no secondary lockfile detection (the user is expected to fully
 *      declare their environment)
 *   2. Node family by lockfile: pnpm > bun > yarn > npm
 *   3. Cargo.toml → rust
 *   4. Python: uv.lock > poetry.lock > requirements.txt
 *   5. go.mod → go
 *   6. Nothing detected → empty plan (skip install)
 */
export async function detectSetup(builder: Sandbox): Promise<SetupPlan> {
  const node = DEFAULT_TOOLCHAIN_VERSIONS.node;
  const python = DEFAULT_TOOLCHAIN_VERSIONS.python;
  const rust = DEFAULT_TOOLCHAIN_VERSIONS.rust;
  const go = DEFAULT_TOOLCHAIN_VERSIONS.go;
  const bun = DEFAULT_TOOLCHAIN_VERSIONS.bun;

  // 1. mise.toml / .tool-versions — user owns toolchain, mise owns install
  if (await exists(builder, 'mise.toml')) {
    const content = await builder.readFile('mise.toml');
    return plan(
      ['mise trust --yes', 'mise install --yes'],
      { files: { 'mise.toml': content } },
      'mise.toml'
    );
  }
  if (await exists(builder, '.tool-versions')) {
    const content = await builder.readFile('.tool-versions');
    return plan(
      ['mise install --yes'],
      { files: { '.tool-versions': content } },
      '.tool-versions'
    );
  }

  // 2. Node family (ordered by lockfile specificity)
  if (await exists(builder, 'pnpm-lock.yaml')) {
    const lockfile = await builder.readFile('pnpm-lock.yaml');
    return plan(
      [
        `mise use -g node@${node} pnpm@latest`,
        'pnpm install --frozen-lockfile',
      ],
      { files: { 'pnpm-lock.yaml': lockfile }, node },
      `node@${node} + pnpm`
    );
  }
  if (await exists(builder, 'bun.lockb')) {
    const lockfile = await builder.readFile('bun.lockb');
    return plan(
      [`mise use -g bun@${bun}`, 'bun install --frozen-lockfile'],
      { files: { 'bun.lockb': lockfile }, bun },
      `bun@${bun}`
    );
  }
  if (await exists(builder, 'yarn.lock')) {
    const lockfile = await builder.readFile('yarn.lock');
    return plan(
      [
        `mise use -g node@${node} yarn@latest`,
        'corepack enable',
        'yarn install --immutable',
      ],
      { files: { 'yarn.lock': lockfile }, node },
      `node@${node} + yarn`
    );
  }
  if (await exists(builder, 'package-lock.json')) {
    const lockfile = await builder.readFile('package-lock.json');
    return plan(
      [`mise use -g node@${node}`, 'npm ci'],
      { files: { 'package-lock.json': lockfile }, node },
      `node@${node} + npm`
    );
  }
  if (await exists(builder, 'package.json')) {
    const pkg = await builder.readFile('package.json');
    return plan(
      [`mise use -g node@${node}`, 'npm install --no-audit --no-fund'],
      { files: { 'package.json': pkg }, node },
      `node@${node} + npm (no lockfile)`
    );
  }

  // 3. Rust
  if (await exists(builder, 'Cargo.toml')) {
    const lockfile = (await existsOrEmpty(builder, 'Cargo.lock')) ?? '';
    const toml = await builder.readFile('Cargo.toml');
    return plan(
      [`mise use -g rust@${rust}`, 'cargo fetch'],
      { files: { 'Cargo.toml': toml, 'Cargo.lock': lockfile }, rust },
      `rust@${rust}`
    );
  }

  // 4. Python
  const hasPyproject = await exists(builder, 'pyproject.toml');
  if (hasPyproject && (await exists(builder, 'uv.lock'))) {
    const lockfile = await builder.readFile('uv.lock');
    const pyproject = await builder.readFile('pyproject.toml');
    return plan(
      [`mise use -g python@${python} uv@latest`, 'uv sync --frozen'],
      {
        files: { 'pyproject.toml': pyproject, 'uv.lock': lockfile },
        python,
      },
      `python@${python} + uv`
    );
  }
  if (hasPyproject && (await exists(builder, 'poetry.lock'))) {
    const lockfile = await builder.readFile('poetry.lock');
    const pyproject = await builder.readFile('pyproject.toml');
    return plan(
      [
        `mise use -g python@${python} poetry@latest`,
        'poetry install --no-root',
      ],
      {
        files: { 'pyproject.toml': pyproject, 'poetry.lock': lockfile },
        python,
      },
      `python@${python} + poetry`
    );
  }
  if (await exists(builder, 'requirements.txt')) {
    const req = await builder.readFile('requirements.txt');
    return plan(
      [`mise use -g python@${python}`, 'pip install -r requirements.txt'],
      { files: { 'requirements.txt': req }, python },
      `python@${python} + pip`
    );
  }

  // 5. Go
  if (await exists(builder, 'go.mod')) {
    const lockfile = (await existsOrEmpty(builder, 'go.sum')) ?? '';
    const gomod = await builder.readFile('go.mod');
    return plan(
      [`mise use -g go@${go}`, 'go mod download'],
      { files: { 'go.mod': gomod, 'go.sum': lockfile }, go },
      `go@${go}`
    );
  }

  return {
    commands: [],
    setupHash: 'empty',
    toolchain: '(no toolchain detected)',
    empty: true,
  };
}

interface HashInput {
  files: Record<string, string>;
  node?: string;
  python?: string;
  rust?: string;
  go?: string;
  bun?: string;
}

function plan(
  commands: string[],
  hashInput: HashInput,
  toolchain: string
): SetupPlan {
  return {
    commands,
    setupHash: hashSetupInput(commands, hashInput),
    toolchain,
    empty: false,
  };
}

function hashSetupInput(commands: string[], input: HashInput): string {
  const hasher = createHash('sha256');
  hasher.update(commands.join('\n'));
  for (const [key, value] of Object.entries(input.files).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0
  )) {
    hasher.update(`\n---${key}---\n${value}`);
  }
  if (input.node) hasher.update(`\nnode=${input.node}`);
  if (input.python) hasher.update(`\npython=${input.python}`);
  if (input.rust) hasher.update(`\nrust=${input.rust}`);
  if (input.go) hasher.update(`\ngo=${input.go}`);
  if (input.bun) hasher.update(`\nbun=${input.bun}`);
  return hasher.digest('hex').slice(0, 16);
}

async function exists(sandbox: Sandbox, path: string): Promise<boolean> {
  try {
    await sandbox.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function existsOrEmpty(
  sandbox: Sandbox,
  path: string
): Promise<string | null> {
  try {
    return await sandbox.readFile(path);
  } catch {
    return null;
  }
}
