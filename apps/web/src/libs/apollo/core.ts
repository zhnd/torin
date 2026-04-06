import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { GRAPHQL_ENDPOINT } from './constants';

export function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: GRAPHQL_ENDPOINT,
      credentials: 'include',
    }),
  });
}
