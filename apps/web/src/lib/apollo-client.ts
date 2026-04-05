import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

export function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql',
    }),
  });
}
