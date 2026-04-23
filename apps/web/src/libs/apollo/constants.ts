export const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql';

export const GRAPHQL_WS_ENDPOINT =
  process.env.NEXT_PUBLIC_API_WS_URL ??
  GRAPHQL_ENDPOINT.replace(/^http/, 'ws');
