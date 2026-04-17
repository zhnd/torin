/**
 * Credential broker for git over HTTPS.
 *
 * The token is never written to .git/config. Instead we register a git
 * credential.helper that reads from the GH_TOKEN env var at command time.
 * Callers inject GH_TOKEN through the exec env (never through getState()),
 * so snapshots/reconnects of the container do not leak the token.
 */
export const CREDENTIAL_HELPER =
  '!f() { echo username=x-access-token; echo password=$GH_TOKEN; }; f';

export function buildCredentialEnv(
  token: string | undefined
): Record<string, string> {
  return token ? { GH_TOKEN: token } : {};
}

export function redactTokenFromUrl(url: string): string {
  return url.replace(/(https?:\/\/)[^@/]+:[^@/]+@/, '$1***@');
}
