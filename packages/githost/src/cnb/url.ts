import type { ParsedRepo } from '../interface.js';

const CNB_URL_RE = /^https?:\/\/cnb\.cool\/(.+?)(?:\.git)?\/?$/;

export function parseCnbUrl(url: string): ParsedRepo {
  const match = url.match(CNB_URL_RE);
  if (!match) {
    throw new Error(`Invalid cnb.cool URL: ${url}`);
  }
  const segments = match[1].split('/').filter((s) => s.length > 0);
  if (segments.length < 2) {
    throw new Error(
      `cnb.cool URL must have at least one group and a repo: ${url}`
    );
  }
  return {
    provider: 'cnb',
    host: 'cnb.cool',
    pathSegments: segments,
    owner: segments[0],
    repo: segments[segments.length - 1],
  };
}
