import { Octokit } from '@octokit/rest';
import type { PullRequestResult } from '@torin/domain';
import { firstAddedLinePosition } from '../diff-position.js';
import type {
  AddReviewCommentsArgs,
  BotIdentity,
  CreatePullRequestArgs,
  GitHostClient,
  GitHostProvider,
  ParsedRepo,
} from '../interface.js';

export interface GitHubClientOptions {
  token: string;
  repo: ParsedRepo;
  botIdentity: BotIdentity;
}

export class GitHubClient implements GitHostClient {
  readonly provider: GitHostProvider = 'github';
  readonly repo: ParsedRepo;
  readonly botIdentity: BotIdentity;
  readonly token: string;
  private readonly octokit: Octokit;

  constructor(opts: GitHubClientOptions) {
    this.repo = opts.repo;
    this.botIdentity = opts.botIdentity;
    this.token = opts.token;
    this.octokit = new Octokit({ auth: opts.token });
  }

  async createPullRequest(
    args: CreatePullRequestArgs
  ): Promise<PullRequestResult> {
    const { data } = await this.octokit.pulls.create({
      owner: this.repo.owner,
      repo: this.repo.repo,
      head: args.head,
      base: args.base,
      title: args.title,
      body: args.body,
    });
    return { url: data.html_url, number: data.number };
  }

  async addReviewComments(args: AddReviewCommentsArgs): Promise<void> {
    const { data: files } = await this.octokit.pulls.listFiles({
      owner: this.repo.owner,
      repo: this.repo.repo,
      pull_number: args.pullNumber,
    });

    const comments: { path: string; body: string; position: number }[] = [];
    for (const change of args.changes) {
      const prFile = files.find((f) => f.filename === change.file);
      if (!prFile?.patch) continue;
      const position = firstAddedLinePosition(prFile.patch);
      if (position == null) continue;
      comments.push({
        path: change.file,
        body: `🤖 **Torin:** ${change.description}`,
        position,
      });
    }

    if (comments.length === 0) return;

    await this.octokit.pulls.createReview({
      owner: this.repo.owner,
      repo: this.repo.repo,
      pull_number: args.pullNumber,
      event: 'COMMENT',
      comments,
    });
  }
}
