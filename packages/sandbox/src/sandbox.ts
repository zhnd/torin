export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface Sandbox {
  id: string;
  executeCommand(command: string): Promise<CommandResult>;
  readFile(path: string): Promise<string>;
  listFiles(path: string): Promise<string[]>;
  destroy(): Promise<void>;
}

export interface CreateSandboxOptions {
  repoUrl: string;
  image?: string;
}
