import { createDockerSandbox } from '@torin/sandbox';
import { log } from '../logger.js';

export async function createSandboxActivity(
  repoUrl: string,
  image?: string
): Promise<string> {
  log.info({ repoUrl }, 'Creating sandbox');
  const sandbox = await createDockerSandbox({ repoUrl, image });
  log.info({ sandboxId: sandbox.id }, 'Sandbox created');
  return sandbox.id;
}
