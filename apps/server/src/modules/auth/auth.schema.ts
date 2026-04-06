import { builder } from '../../infrastructure/graphql/builder.js';

export const AuthPayload = builder.simpleObject('AuthPayload', {
  fields: (t) => ({
    token: t.string(),
    user: t.field({ type: AuthUser }),
  }),
});

const AuthUser = builder.simpleObject('AuthUser', {
  fields: (t) => ({
    id: t.string(),
    name: t.string(),
    email: t.string(),
  }),
});
