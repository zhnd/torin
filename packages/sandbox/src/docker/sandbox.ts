import { Buffer } from 'node:buffer';
import path from 'node:path/posix';
import type Docker from 'dockerode';
import type {
  ExecOptions,
  ExecResult,
  Sandbox,
  SandboxDirent,
  SandboxHooks,
  SandboxStats,
} from '../interface.js';
import { log } from '../logger.js';
import type { DockerSandboxState } from '../state.js';
import { buildCredentialEnv } from './credential-broker.js';
import { buildExecInput, execInContainer } from './exec.js';
import { readFileFromContainer, writeFileToContainer } from './filesystem.js';

export interface DockerSandboxInit {
  docker: Docker;
  container: Docker.Container;
  workingDirectory: string;
  env?: Record<string, string>;
  githubToken?: string;
  currentBranch?: string;
  hooks?: SandboxHooks;
}

export class DockerSandbox implements Sandbox {
  readonly provider = 'docker' as const;
  readonly id: string;
  readonly workingDirectory: string;
  readonly env?: Record<string, string>;
  readonly currentBranch?: string;
  readonly hooks?: SandboxHooks;

  private readonly docker: Docker;
  private readonly container: Docker.Container;
  private readonly credentialEnv: Record<string, string>;
  private stopped = false;

  constructor(init: DockerSandboxInit) {
    this.docker = init.docker;
    this.container = init.container;
    this.id = init.container.id;
    this.workingDirectory = init.workingDirectory;
    this.env = init.env;
    this.currentBranch = init.currentBranch;
    this.hooks = init.hooks;
    this.credentialEnv = buildCredentialEnv(init.githubToken);
  }

  async exec(command: string, options?: ExecOptions): Promise<ExecResult> {
    const input = buildExecInput(
      this.workingDirectory,
      this.env,
      this.credentialEnv,
      command,
      options
    );
    return execInContainer(this.docker, this.container, input);
  }

  async readFile(filePath: string): Promise<string> {
    const absolute = this.resolvePath(filePath);
    const buffer = await readFileFromContainer(this.container, absolute);
    return buffer.toString('utf-8');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const absolute = this.resolvePath(filePath);
    await this.mkdir(path.dirname(absolute), { recursive: true });
    await writeFileToContainer(
      this.container,
      absolute,
      Buffer.from(content, 'utf-8')
    );
  }

  async stat(filePath: string): Promise<SandboxStats> {
    const absolute = this.resolvePath(filePath);
    const result = await this.exec(
      `stat -c '%F\t%s\t%Y' ${shellArg(absolute)}`,
      { cwd: this.workingDirectory, timeoutMs: 5_000 }
    );
    if (!result.success) {
      throw new Error(`ENOENT: ${filePath}`);
    }
    const [fileType = '', sizeStr = '0', mtimeStr = '0'] = result.stdout
      .trim()
      .split('\t');
    const isDir = fileType === 'directory';
    return {
      isDirectory: () => isDir,
      isFile: () => !isDir,
      size: Number.parseInt(sizeStr, 10) || 0,
      mtimeMs: (Number.parseInt(mtimeStr, 10) || 0) * 1000,
    };
  }

  async mkdir(
    filePath: string,
    options?: { recursive?: boolean }
  ): Promise<void> {
    const absolute = this.resolvePath(filePath);
    const flag = options?.recursive ? '-p' : '';
    const result = await this.exec(`mkdir ${flag} ${shellArg(absolute)}`, {
      cwd: this.workingDirectory,
      timeoutMs: 5_000,
    });
    if (!result.success) {
      throw new Error(
        `Failed to create directory ${filePath}: ${result.stderr}`
      );
    }
  }

  async readdir(filePath: string): Promise<SandboxDirent[]> {
    const absolute = this.resolvePath(filePath);
    const result = await this.exec(
      `find ${shellArg(absolute)} -maxdepth 1 -mindepth 1 -printf '%y\\t%f\\n'`,
      { cwd: this.workingDirectory, timeoutMs: 10_000 }
    );
    if (!result.success) {
      throw new Error(`ENOENT: ${filePath}`);
    }
    return result.stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [type, ...nameParts] = line.split('\t');
        const name = nameParts.join('\t');
        return {
          name,
          isDir: type === 'd',
          isFile: type === 'f',
          isSymlink: type === 'l',
        };
      });
  }

  async stop(): Promise<void> {
    if (this.stopped) return;
    this.stopped = true;
    if (this.hooks?.beforeStop) {
      try {
        await this.hooks.beforeStop(this);
      } catch (error) {
        log.warn(
          { err: error instanceof Error ? error.message : String(error) },
          'beforeStop hook failed'
        );
      }
    }
    await this.container.stop().catch(() => {});
    await this.container.remove({ force: true }).catch(() => {});
  }

  getState(): DockerSandboxState {
    return {
      provider: 'docker',
      containerId: this.id,
      workingDirectory: this.workingDirectory,
      ...(this.currentBranch ? { currentBranch: this.currentBranch } : {}),
    };
  }

  private resolvePath(filePath: string): string {
    return path.isAbsolute(filePath)
      ? filePath
      : path.join(this.workingDirectory, filePath);
  }
}

function shellArg(input: string): string {
  return `'${input.replace(/'/g, `'\\''`)}'`;
}
