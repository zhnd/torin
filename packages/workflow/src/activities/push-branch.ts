import { prisma } from '@torin/database';
import { connectSandbox, type SandboxState } from '@torin/sandbox';
import { decrypt, getEncryptionKey } from '@torin/shared';
import { log } from '../logger.js';

export async function pushBranchActivity(
  state: SandboxState,
  branch: string,
  options: { projectId?: string } = {}
): Promise<void> {
  log.info({ branch }, 'Pushing branch');

  let githubToken: string | undefined;
  if (options.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: options.projectId },
    });
    if (project?.encryptedCredentials) {
      githubToken = decrypt(project.encryptedCredentials, getEncryptionKey());
    }
  }

  const sandbox = await connectSandbox(state, { githubToken });
  const result = await sandbox.exec(`git push origin ${branch}`, {
    timeoutMs: 120_000,
  });
  if (!result.success) {
    throw new Error(
      `git push failed (${result.exitCode}): ${result.stderr || result.stdout}`
    );
  }
  log.info({ branch }, 'Branch pushed');
}
