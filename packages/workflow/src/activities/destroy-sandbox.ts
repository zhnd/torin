import { connectDockerSandbox } from '@torin/sandbox';
import { log } from '../logger.js';

export async function destroySandboxActivity(sandboxId: string): Promise<void> {
  log.info({ sandboxId }, 'Destroying sandbox');
  const sandbox = await connectDockerSandbox(sandboxId);
  await sandbox.destroy();
  log.info({ sandboxId }, 'Sandbox destroyed');
}
