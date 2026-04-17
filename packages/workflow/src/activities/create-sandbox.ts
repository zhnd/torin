import { prisma } from '@torin/database';
import { createSandbox, type SandboxState } from '@torin/sandbox';
import { decrypt, getEncryptionKey } from '@torin/shared';
import { log } from '../logger.js';

export interface CreateSandboxActivityOptions {
  /** Override the container image. When set, bypasses the repo cache. */
  image?: string;
  projectId?: string;
  branch?: string;
  newBranch?: string;
}

export async function createSandboxActivity(
  repoUrl: string,
  options: CreateSandboxActivityOptions = {}
): Promise<SandboxState> {
  log.info({ repoUrl, branch: options.branch }, 'Creating sandbox');

  let githubToken: string | undefined;
  if (options.projectId) {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: options.projectId },
    });
    if (project.encryptedCredentials) {
      githubToken = decrypt(project.encryptedCredentials, getEncryptionKey());
    }
  }

  const sandbox = await createSandbox({
    provider: 'docker',
    source: {
      repo: repoUrl,
      token: githubToken,
      branch: options.branch,
      newBranch: options.newBranch,
    },
    gitUser: {
      name: 'torin-bot',
      email: 'torin-bot@users.noreply.github.com',
    },
    githubToken,
    docker: {
      image: options.image,
    },
  });
  const state = sandbox.getState();
  log.info({ containerId: state.containerId }, 'Sandbox created');
  return state;
}
