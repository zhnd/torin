import type { ParsedRepo } from '../interface.js';

const GITHUB_URL_RE = /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/;

export function parseGitHubUrl(url: string): ParsedRepo {
  const match = url.match(GITHUB_URL_RE);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }
  const owner = match[1];
  const repo = match[2];
  return {
    provider: 'github',
    host: 'github.com',
    pathSegments: [owner, repo],
    owner,
    repo,
  };
}
