export { firstAddedLinePosition } from './diff-position.js';
export type { CreateGitClientOptions } from './factory.js';
export {
  createGitClient,
  defaultBotIdentity,
  gitCredentialsFor,
  mapAuthProvider,
} from './factory.js';
export type {
  AddReviewCommentsArgs,
  BotIdentity,
  CreatePullRequestArgs,
  GitCredentials,
  GitHostClient,
  GitHostProvider,
  ParsedRepo,
} from './interface.js';
export { parseCnbUrl, parseGitHubUrl, parseRepoUrl } from './url.js';
