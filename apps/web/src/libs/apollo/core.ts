import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { toast } from 'sonner';
import { GRAPHQL_ENDPOINT, GRAPHQL_WS_ENDPOINT } from './constants';

/**
 * Suppress the same error toast within this window. Apollo can fire one
 * onError per affected query; without dedup a single network outage
 * paints the screen with duplicates.
 */
const ERROR_TOAST_WINDOW_MS = 60_000;
const recentErrors = new Map<string, number>();

function showErrorToast(message: string): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const last = recentErrors.get(message);
  if (last !== undefined && now - last < ERROR_TOAST_WINDOW_MS) return;
  recentErrors.set(message, now);
  toast.error(message);
}

export function makeClient() {
  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        const code = (err.extensions?.code ?? '') as string;
        // The web layer already redirects to /login on 401 via auth-client;
        // surfacing a toast there would be noisy and redundant.
        if (code === 'UNAUTHORIZED') continue;
        showErrorToast(err.message || 'Request failed');
      }
    }
    if (networkError) {
      const msg =
        'message' in networkError && networkError.message
          ? networkError.message
          : 'Network error — check your connection';
      showErrorToast(msg);
      // Always log network failures with operation context — silent
      // failures are how broken pages become invisible bugs.
      console.warn(
        `Apollo network error on ${operation.operationName}:`,
        networkError
      );
    }
  });

  const httpLink = new HttpLink({
    uri: GRAPHQL_ENDPOINT,
    credentials: 'include',
  });

  // Browser-only ws link. SSR falls back to http-only — subscriptions
  // aren't meaningful server-side anyway.
  const transport =
    typeof window === 'undefined'
      ? httpLink
      : split(
          ({ query }) => {
            const def = getMainDefinition(query);
            return (
              def.kind === 'OperationDefinition' &&
              def.operation === 'subscription'
            );
          },
          new GraphQLWsLink(
            createClient({
              url: GRAPHQL_WS_ENDPOINT,
              // No `connectionParams` by design: the browser already
              // sends HttpOnly session cookies with the upgrade HTTP
              // request, and `document.cookie` never contains them.
              // Setting it here would only clobber the real cookie the
              // server reads from the upgrade request headers.
              retryAttempts: 10,
              shouldRetry: () => true,
            })
          ),
          httpLink
        );

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: errorLink.concat(transport),
  });
}
