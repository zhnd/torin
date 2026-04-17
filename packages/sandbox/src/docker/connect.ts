import Docker from 'dockerode';
import type { SandboxHooks } from '../interface.js';
import { log } from '../logger.js';
import type { DockerSandboxState } from '../state.js';
import { DockerSandbox } from './sandbox.js';

export interface ConnectDockerSandboxOptions {
  env?: Record<string, string>;
  githubToken?: string;
  hooks?: SandboxHooks;
}

export async function connectDockerSandbox(
  state: DockerSandboxState,
  options: ConnectDockerSandboxOptions = {}
): Promise<DockerSandbox> {
  const docker = new Docker();
  const container = docker.getContainer(state.containerId);
  log.debug({ containerId: state.containerId }, 'Reconnecting to container');
  return new DockerSandbox({
    docker,
    container,
    workingDirectory: state.workingDirectory,
    env: options.env,
    githubToken: options.githubToken,
    currentBranch: state.currentBranch,
    hooks: options.hooks,
  });
}
