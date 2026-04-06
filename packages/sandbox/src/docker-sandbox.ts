import { PassThrough } from 'node:stream';
import Docker from 'dockerode';
import { log } from './logger.js';
import type {
  CommandResult,
  CreateSandboxOptions,
  Sandbox,
} from './sandbox.js';

const REPO_DIR = '/workspace/repo';

export async function createDockerSandbox(
  options: CreateSandboxOptions
): Promise<Sandbox> {
  const docker = new Docker();
  const image = options.image ?? 'node:22-slim';

  // Ensure the image is available
  log.info({ image }, 'Checking image');
  try {
    await docker.getImage(image).inspect();
    log.debug('Image found locally');
  } catch {
    log.info('Pulling image');
    await new Promise<void>((resolve, reject) => {
      docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (err: Error | null) =>
          err ? reject(err) : resolve()
        );
      });
    });
    log.info('Image pulled');
  }

  log.info('Creating container');
  const container = await docker.createContainer({
    Image: image,
    Cmd: ['sleep', 'infinity'],
    WorkingDir: REPO_DIR,
    HostConfig: {
      NetworkMode: 'bridge',
      Memory: 512 * 1024 * 1024, // 512MB
      CpuPeriod: 100000,
      CpuQuota: 100000, // 1 CPU
    },
  });

  log.debug('Starting container');
  await container.start();
  log.info('Container started');

  // Install git and clone the repo
  log.debug('Installing git');
  await execInContainer(
    docker,
    container,
    `apt-get update -qq && apt-get install -y -qq git > /dev/null 2>&1`
  );
  log.debug('Cloning repo');
  const cloneDepth = options.fullClone ? '' : '--depth 1';
  await execInContainer(
    docker,
    container,
    `git clone ${cloneDepth} ${options.repoUrl} ${REPO_DIR}`
  );
  log.info({ sandboxId: container.id }, 'Repo cloned');

  if (options.gitToken) {
    log.debug('Configuring git auth');
    // Inject token into remote URL for push access
    const authedUrl = options.repoUrl.replace(
      'https://github.com/',
      `https://x-access-token:${options.gitToken}@github.com/`
    );
    await execInContainer(
      docker,
      container,
      [
        `git config user.name "torin-bot"`,
        `git config user.email "torin-bot@users.noreply.github.com"`,
        `git remote set-url origin "${authedUrl}"`,
      ].join(' && ')
    );
  }

  return buildSandbox(docker, container);
}

export async function connectDockerSandbox(
  sandboxId: string
): Promise<Sandbox> {
  const docker = new Docker();
  const container = docker.getContainer(sandboxId);
  log.debug({ sandboxId }, 'Reconnecting to container');
  return buildSandbox(docker, container);
}

async function execInContainer(
  docker: Docker,
  container: Docker.Container,
  command: string
): Promise<CommandResult> {
  const exec = await container.exec({
    Cmd: ['sh', '-c', command],
    AttachStdout: true,
    AttachStderr: true,
    WorkingDir: REPO_DIR,
  });

  const stream = await exec.start({ Detach: false, Tty: false });
  const { stdout, stderr } = await collectOutput(docker, stream);
  const inspect = await exec.inspect();

  return {
    exitCode: inspect.ExitCode ?? 0,
    stdout,
    stderr,
  };
}

function buildSandbox(docker: Docker, container: Docker.Container): Sandbox {
  return {
    id: container.id,

    async executeCommand(command: string): Promise<CommandResult> {
      return execInContainer(docker, container, command);
    },

    async writeFile(path: string, content: string): Promise<void> {
      const absPath = path.startsWith('/') ? path : `${REPO_DIR}/${path}`;
      // Ensure parent directory exists
      await execInContainer(
        docker,
        container,
        `mkdir -p "$(dirname "${absPath}")"`
      );
      // Use base64 encoding for safe transfer of arbitrary content
      const encoded = Buffer.from(content).toString('base64');
      const result = await execInContainer(
        docker,
        container,
        `echo "${encoded}" | base64 -d > "${absPath}"`
      );
      if (result.exitCode !== 0) {
        throw new Error(`Failed to write file ${path}: ${result.stderr}`);
      }
    },

    async readFile(path: string): Promise<string> {
      const result = await execInContainer(docker, container, `cat "${path}"`);
      if (result.exitCode !== 0) {
        throw new Error(`Failed to read file ${path}: ${result.stderr}`);
      }
      return result.stdout;
    },

    async listFiles(path: string): Promise<string[]> {
      const result = await execInContainer(
        docker,
        container,
        `find "${path}" -maxdepth 3 -type f 2>/dev/null`
      );
      return result.stdout.split('\n').filter(Boolean);
    },

    async destroy(): Promise<void> {
      await container.stop().catch(() => {});
      await container.remove({ force: true });
    },
  };
}

function collectOutput(
  docker: Docker,
  stream: NodeJS.ReadableStream
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    const stdout = new PassThrough();
    const stderr = new PassThrough();

    docker.modem.demuxStream(stream, stdout, stderr);

    stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

    stream.on('end', () => {
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
        stderr: Buffer.concat(stderrChunks).toString('utf-8'),
      });
    });

    stream.on('error', reject);
  });
}
