import {
  type ConnectDockerSandboxOptions,
  type CreateDockerSandboxOptions,
  connectDockerSandbox,
  createDockerSandbox,
} from './docker/index.js';
import type { Sandbox, SandboxHooks, SandboxProvider } from './interface.js';
import type { SandboxState } from './state.js';
import type { GitUser, Source } from './types.js';

/**
 * Options accepted by `createSandbox`. `provider` selects the implementation;
 * provider-specific fields are grouped on the same object so the caller does
 * not need to know about implementation-specific option shapes.
 */
export interface CreateSandboxOptions {
  provider?: SandboxProvider;
  source?: Source;
  env?: Record<string, string>;
  githubToken?: string;
  gitUser?: GitUser;
  hooks?: SandboxHooks;
  workingDirectory?: string;
  docker?: Omit<
    CreateDockerSandboxOptions,
    'source' | 'env' | 'githubToken' | 'gitUser' | 'hooks' | 'workingDirectory'
  >;
}

export interface ConnectSandboxOptions {
  env?: Record<string, string>;
  githubToken?: string;
  hooks?: SandboxHooks;
}

/**
 * Create a new sandbox of the requested provider type.
 * Only the docker provider is implemented today; additional providers plug in
 * here without changing the caller-facing surface.
 */
export async function createSandbox(
  options: CreateSandboxOptions = {}
): Promise<Sandbox> {
  const provider = options.provider ?? 'docker';
  switch (provider) {
    case 'docker':
      return createDockerSandbox({
        source: options.source,
        env: options.env,
        githubToken: options.githubToken,
        gitUser: options.gitUser,
        hooks: options.hooks,
        workingDirectory: options.workingDirectory,
        ...options.docker,
      });
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unsupported sandbox provider: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Reconnect to an existing sandbox described by its serialized state.
 * Used by Temporal activities to continue operating on a sandbox that was
 * created by an earlier activity.
 */
export async function connectSandbox(
  state: SandboxState,
  options: ConnectSandboxOptions = {}
): Promise<Sandbox> {
  switch (state.provider) {
    case 'docker':
      return connectDockerSandbox(
        state,
        options as ConnectDockerSandboxOptions
      );
    default: {
      const _exhaustive: never = state.provider;
      throw new Error(
        `Unsupported sandbox state provider: ${String(_exhaustive)}`
      );
    }
  }
}
