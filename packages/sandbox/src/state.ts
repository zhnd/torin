export interface DockerSandboxState {
  provider: 'docker';
  containerId: string;
  workingDirectory: string;
  currentBranch?: string;
}

export type SandboxState = DockerSandboxState;
