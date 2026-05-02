import { parseCnbUrl } from './cnb/url.js';
import { parseGitHubUrl } from './github/url.js';
import type { ParsedRepo } from './interface.js';

export function parseRepoUrl(url: string): ParsedRepo {
  if (/(?:^|[/@])github\.com[/:]/.test(url)) return parseGitHubUrl(url);
  if (/^https?:\/\/cnb\.cool\//.test(url)) return parseCnbUrl(url);
  throw new Error(`Unrecognized git host in URL: ${url}`);
}

export { parseCnbUrl, parseGitHubUrl };
