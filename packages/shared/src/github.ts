/**
 * @deprecated Use `parseGitHubUrl` from `@torin/githost` instead. This shim
 * exists for one release window so external callers in `@torin/shared`
 * consumers do not break in the same PR that introduces multi-host support.
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }
  return { owner: match[1], repo: match[2] };
}
