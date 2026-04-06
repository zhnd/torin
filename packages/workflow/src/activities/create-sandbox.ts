import { prisma } from '@torin/database';
import { createDockerSandbox } from '@torin/sandbox';
import { decrypt, getEncryptionKey } from '@torin/shared';
import { log } from '../logger.js';

export async function createSandboxActivity(
  repoUrl: string,
  options?: { image?: string; projectId?: string; fullClone?: boolean }
): Promise<string> {
  log.info({ repoUrl, fullClone: options?.fullClone }, 'Creating sandbox');

  let gitToken: string | undefined;
  if (options?.projectId) {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: options.projectId },
    });
    if (project.encryptedCredentials) {
      gitToken = decrypt(project.encryptedCredentials, getEncryptionKey());
    }
  }

  const sandbox = await createDockerSandbox({
    repoUrl,
    image: options?.image,
    gitToken,
    fullClone: options?.fullClone,
  });
  log.info({ sandboxId: sandbox.id }, 'Sandbox created');
  return sandbox.id;
}
