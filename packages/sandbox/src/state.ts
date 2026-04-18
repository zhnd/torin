export interface DockerSandboxState {
  provider: 'docker';
  containerId: string;
  workingDirectory: string;
  currentBranch?: string;
  /** Ports that were published when the container was created. */
  ports?: number[];
  /** containerPort → hostPort mapping, cached at create time. */
  portMap?: Record<number, number>;
}

export type SandboxState = DockerSandboxState;
