import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import type { Sandbox } from '@torin/sandbox';
import { z } from 'zod/v4';

export function createSandboxMcpServer(sandbox: Sandbox) {
  const bash = tool(
    'bash',
    'Execute a shell command in the sandbox repository. Use for exploring files, running scripts, checking dependencies, etc.',
    { command: z.string().describe('The shell command to execute') },
    async (args) => {
      const result = await sandbox.executeCommand(args.command);
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
      return {
        content: [
          {
            type: 'text' as const,
            text: output || '(no output)',
          },
        ],
        isError: result.exitCode !== 0,
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
      const files = await sandbox.listFiles(args.path);
      return {
        content: [{ type: 'text' as const, text: files.join('\n') }],
      };
    }
  );

  return createSdkMcpServer({
    name: 'sandbox',
    version: '1.0.0',
    tools: [bash, readFile, listFiles],
  });
}
