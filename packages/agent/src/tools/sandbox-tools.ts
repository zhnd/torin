import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import type { Sandbox } from '@torin/sandbox';
import { z } from 'zod/v4';

export function createSandboxMcpServer(sandbox: Sandbox) {
  const bash = tool(
    'bash',
    'Execute a shell command in the sandbox repository. Use for exploring files, running scripts, checking dependencies, etc.',
    {
      command: z.string().describe('The shell command to execute'),
      cwd: z
        .string()
        .optional()
        .describe(
          'Optional working directory (absolute path or relative to repo root). Defaults to the repo root.'
        ),
      timeoutMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Optional command timeout in milliseconds (default 60000).'),
    },
    async (args) => {
      const result = await sandbox.exec(args.command, {
        cwd: args.cwd,
        timeoutMs: args.timeoutMs,
      });
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
      const trailer = result.truncated
        ? '\n\n[output truncated]'
        : result.exitCode === null
          ? `\n\n[no exit code — ${result.stderr ? 'see stderr' : 'process did not complete'}]`
          : '';
      return {
        content: [
          {
            type: 'text' as const,
            text: (output || '(no output)') + trailer,
          },
        ],
        isError: !result.success,
      };
    }
  );

  const readFile = tool(
    'read_file',
    'Read the contents of a file in the repository.',
    {
      path: z.string().describe('File path relative to the repository root'),
    },
    async (args) => {
      const content = await sandbox.readFile(args.path);
      return {
        content: [{ type: 'text' as const, text: content }],
      };
    }
  );

  const listFiles = tool(
    'list_files',
    'List files in a directory (up to 3 levels deep).',
    {
      path: z
        .string()
        .describe('Directory path relative to repo root. Use "." for root.'),
    },
    async (args) => {
      const result = await sandbox.exec(
        `find ${shellArg(args.path)} -maxdepth 3 -type f`,
        { timeoutMs: 15_000 }
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: result.stdout.trim() || '(no files)',
          },
        ],
        isError: !result.success,
      };
    }
  );

  const writeFile = tool(
    'write_file',
    'Write content to a file in the repository. Creates parent directories if needed.',
    {
      path: z.string().describe('File path relative to the repository root'),
      content: z.string().describe('The full file content to write'),
    },
    async (args) => {
      await sandbox.writeFile(args.path, args.content);
      return {
        content: [{ type: 'text' as const, text: `Wrote ${args.path}` }],
      };
    }
  );

  return createSdkMcpServer({
    name: 'sandbox',
    version: '1.0.0',
    tools: [bash, readFile, listFiles, writeFile],
  });
}

function shellArg(input: string): string {
  return `'${input.replace(/'/g, `'\\''`)}'`;
}
