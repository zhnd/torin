import type { GitHostProvider } from '@torin/githost';

export interface Source {
  repo: string;
  branch?: string;
  token?: string;
  newBranch?: string;
  /** Defaults to 'github' when omitted, preserving existing callers. */
  provider?: GitHostProvider;
}

export interface GitUser {
  name: string;
  email: string;
}
