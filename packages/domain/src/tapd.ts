/**
 * Domain types for the Tapd integration. Tapd is Tencent's project
 * management tool (api.tapd.cn). The server stores a per-user Personal
 * Access Token in `TapdCredential` and uses it to fetch the user's
 * open bugs.
 */

/**
 * Slim view of a Tapd bug, used in the inbox list and as the input for
 * a defect-resolve trigger. The Tapd API returns far more fields; we
 * only carry what the UI needs to render a row + prefill a description.
 */
export interface TapdBug {
  id: string;
  workspaceId: string;
  /** Human-readable workspace name; null when not known at fetch time. */
  workspaceName: string | null;
  title: string;
  description: string;
  status: string;
  priority: string | null;
  currentOwner: string | null;
  url: string;
  createdAt: string;
}

export interface TapdCredentialStatus {
  configured: boolean;
  /** Tapd login handle (UserWorkspace.user) discovered at save time. */
  tapdNick: string | null;
}
