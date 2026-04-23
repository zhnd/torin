import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { GRAPHQL_ENDPOINT, GRAPHQL_WS_ENDPOINT } from './constants';

export function makeClient() {
  const httpLink = new HttpLink({
    uri: GRAPHQL_ENDPOINT,
    credentials: 'include',
  });

  // Browser-only ws link. SSR falls back to http-only — subscriptions
  // aren't meaningful server-side anyway.
  const link =
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
    link,
  });
}
