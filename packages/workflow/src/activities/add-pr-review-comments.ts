import { Octokit } from '@octokit/rest';
import { prisma } from '@torin/database';
import type { FileChange } from '@torin/domain';
import { decrypt, getEncryptionKey, parseGitHubUrl } from '@torin/shared';
import { log } from '../logger.js';

export async function addPrReviewCommentsActivity(
  projectId: string,
  pullNumber: number,
  changes: FileChange[]
): Promise<void> {
  log.info(
    { projectId, pullNumber, fileCount: changes.length },
    'Adding PR review comments'
  );

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  });
  if (!project.encryptedCredentials) {
    log.warn('No credentials — skipping PR review comments');
    return;
  }

  const token = decrypt(project.encryptedCredentials, getEncryptionKey());
  const { owner, repo } = parseGitHubUrl(project.repositoryUrl);
  const octokit = new Octokit({ auth: token });

  // Get the PR diff to find valid comment positions
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });

  const comments: { path: string; body: string; position: number }[] = [];

  for (const change of changes) {
    const prFile = files.find((f) => f.filename === change.file);
    if (!prFile?.patch) continue;

    // Comment at the first changed line in the diff
    const lines = prFile.patch.split('\n');
    let position = 0;
    for (let i = 0; i < lines.length; i++) {
      position++;
      if (lines[i].startsWith('+') && !lines[i].startsWith('+++')) {
        break;
      }
    }

    comments.push({
      path: change.file,
      body: `🤖 **Torin:** ${change.description}`,
      position,
    });
  }

  if (comments.length === 0) {
    log.info('No valid comment positions found');
    return;
  }

  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    event: 'COMMENT',
    comments,
  });

  log.info({ commentCount: comments.length }, 'PR review comments added');
}
