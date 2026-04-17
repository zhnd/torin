import type { SandboxState } from './state.js';

export type SandboxProvider = 'docker';

export interface ExecResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  truncated: boolean;
}

export interface ExecOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
  maxOutputBytes?: number;
}

export interface SandboxStats {
  isFile(): boolean;
  isDirectory(): boolean;
  size: number;
  mtimeMs: number;
}

export interface SandboxDirent {
  name: string;
  isDir: boolean;
  isFile: boolean;
  isSymlink: boolean;
}

export type SandboxHook = (sandbox: Sandbox) => Promise<void>;

export interface SandboxHooks {
  afterStart?: SandboxHook;
  beforeStop?: SandboxHook;
  onTimeout?: SandboxHook;
}

export interface Sandbox {
  readonly provider: SandboxProvider;
  readonly id: string;
  readonly workingDirectory: string;
  readonly env?: Record<string, string>;
  readonly currentBranch?: string;
  readonly expiresAt?: number;
  readonly hooks?: SandboxHooks;

  exec(command: string, options?: ExecOptions): Promise<ExecResult>;
  execDetached?(
    command: string,
    options?: { cwd?: string; env?: Record<string, string> }
  ): Promise<{ commandId: string }>;

  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  stat(path: string): Promise<SandboxStats>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  readdir(path: string): Promise<SandboxDirent[]>;

  domain?(port: number): string;

  stop(): Promise<void>;
  getState(): SandboxState;
}
