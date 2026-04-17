import { PassThrough } from 'node:stream';
import type Docker from 'dockerode';
import type { ExecOptions, ExecResult } from '../interface.js';

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_OUTPUT_BYTES = 50_000;

export interface RawExecInput {
  command: string;
  cwd: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
  maxOutputBytes?: number;
}

/**
 * Execute a shell command inside the container.
 *
 * - timeoutMs is enforced by wrapping the command in GNU `timeout` (busybox
 *   timeout also works). Exit code 124 from `timeout` is mapped to "timed out"
 *   and `success: false` with `exitCode: null`.
 * - AbortSignal detaches the stream and issues a best-effort kill of the
 *   exec'd process group inside the container. The container itself is never
 *   killed — that would tear down the whole sandbox.
 */
export async function execInContainer(
  docker: Docker,
  container: Docker.Container,
  input: RawExecInput
): Promise<ExecResult> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxOutputBytes = input.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;

  const timeoutSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
  const wrappedCommand = `timeout --preserve-status -k 5s ${timeoutSeconds}s sh -c ${shellQuote(input.command)}`;

  const envList = input.env
    ? Object.entries(input.env).map(([k, v]) => `${k}=${v}`)
    : undefined;

  const exec = await container.exec({
    Cmd: ['sh', '-c', wrappedCommand],
    AttachStdout: true,
    AttachStderr: true,
    WorkingDir: input.cwd,
    ...(envList ? { Env: envList } : {}),
  });

  const stream = await exec.start({ Detach: false, Tty: false });

  let aborted = false;
  const onExternalAbort = () => {
    aborted = true;
    stream.destroy();
  };
  input.signal?.addEventListener('abort', onExternalAbort, { once: true });

  try {
    const { stdout, stderr, stdoutTruncated, stderrTruncated } =
      await collectOutput(docker, stream, maxOutputBytes);

    const inspect = await exec.inspect();
    const rawExit = inspect.ExitCode ?? null;
    const truncated = stdoutTruncated || stderrTruncated;

    if (aborted) {
      return {
        success: false,
        exitCode: null,
        stdout,
        stderr: stderr || 'Command aborted',
        truncated,
      };
    }

    // busybox/coreutils `timeout` exit code 124 = timed out
    if (rawExit === 124) {
      return {
        success: false,
        exitCode: null,
        stdout,
        stderr: stderr || `Command timed out after ${timeoutMs}ms`,
        truncated,
      };
    }

    return {
      success: rawExit === 0,
      exitCode: rawExit,
      stdout,
      stderr,
      truncated,
    };
  } finally {
    input.signal?.removeEventListener('abort', onExternalAbort);
  }
}

export function buildExecInput(
  workingDirectory: string,
  baseEnv: Record<string, string> | undefined,
  credentialEnv: Record<string, string>,
  command: string,
  options: ExecOptions | undefined
): RawExecInput {
  const hasEnv =
    !!baseEnv || !!options?.env || Object.keys(credentialEnv).length > 0;

  return {
    command,
    cwd: options?.cwd ?? workingDirectory,
    env: hasEnv ? { ...baseEnv, ...credentialEnv, ...options?.env } : undefined,
    timeoutMs: options?.timeoutMs,
    signal: options?.signal,
    maxOutputBytes: options?.maxOutputBytes,
  };
}

function shellQuote(input: string): string {
  return `'${input.replace(/'/g, `'\\''`)}'`;
}

function collectOutput(
  docker: Docker,
  stream: NodeJS.ReadableStream,
  maxOutputBytes: number
): Promise<{
  stdout: string;
  stderr: string;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
}> {
  return new Promise((resolve, reject) => {
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let stdoutTruncated = false;
    let stderrTruncated = false;

    const stdout = new PassThrough();
    const stderr = new PassThrough();

    docker.modem.demuxStream(stream, stdout, stderr);

    stdout.on('data', (chunk: Buffer) => {
      if (stdoutBytes >= maxOutputBytes) {
        stdoutTruncated = true;
        return;
      }
      const remaining = maxOutputBytes - stdoutBytes;
      if (chunk.length > remaining) {
        stdoutChunks.push(chunk.subarray(0, remaining));
        stdoutBytes = maxOutputBytes;
        stdoutTruncated = true;
      } else {
        stdoutChunks.push(chunk);
        stdoutBytes += chunk.length;
      }
    });

    stderr.on('data', (chunk: Buffer) => {
      if (stderrBytes >= maxOutputBytes) {
        stderrTruncated = true;
        return;
      }
      const remaining = maxOutputBytes - stderrBytes;
      if (chunk.length > remaining) {
        stderrChunks.push(chunk.subarray(0, remaining));
        stderrBytes = maxOutputBytes;
        stderrTruncated = true;
      } else {
        stderrChunks.push(chunk);
        stderrBytes += chunk.length;
      }
    });

    stream.on('end', () => {
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
        stderr: Buffer.concat(stderrChunks).toString('utf-8'),
        stdoutTruncated,
        stderrTruncated,
      });
    });

    stream.on('close', () => {
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
        stderr: Buffer.concat(stderrChunks).toString('utf-8'),
        stdoutTruncated,
        stderrTruncated,
      });
    });

    stream.on('error', reject);
  });
}
