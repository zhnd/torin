import { Octokit } from '@octokit/rest';
import { prisma } from '@torin/database';
import type { PullRequestResult } from '@torin/domain';
import { decrypt, getEncryptionKey, parseGitHubUrl } from '@torin/shared';
import { log } from '../logger.js';

export async function createPullRequestActivity(
  projectId: string,
  head: string,
  base: string,
  title: string,
  body: string
): Promise<PullRequestResult> {
  log.info({ projectId, head, base }, 'Creating pull request');

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  });
  if (!project.encryptedCredentials) {
    throw new Error('Project has no credentials configured');
  }

  const token = decrypt(project.encryptedCredentials, getEncryptionKey());
  const { owner, repo } = parseGitHubUrl(project.repositoryUrl);

  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    head,
    base,
    title,
    body,
  });

  log.info(
    { prUrl: data.html_url, prNumber: data.number },
    'Pull request created'
  );
  return { url: data.html_url, number: data.number };
}
