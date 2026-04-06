import { connectDockerSandbox } from '@torin/sandbox';
import { log } from '../logger.js';

export async function pushBranchActivity(
  sandboxId: string,
  branch: string
): Promise<void> {
  log.info({ sandboxId, branch }, 'Pushing branch');
  const sandbox = await connectDockerSandbox(sandboxId);
  const result = await sandbox.executeCommand(`git push origin ${branch}`);
  if (result.exitCode !== 0) {
    throw new Error(`git push failed: ${result.stderr}`);
  }
  log.info({ branch }, 'Branch pushed');
}
