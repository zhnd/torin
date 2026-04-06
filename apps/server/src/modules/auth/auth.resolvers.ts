import { auth } from '../../infrastructure/auth/better-auth.config.js';
import { builder } from '../../infrastructure/graphql/builder.js';
import { AuthPayload } from './auth.schema.js';

builder.mutationField('signIn', (t) =>
  t.field({
    type: AuthPayload,
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args) => {
      const result = await auth.api.signInEmail({
        body: { email: args.email, password: args.password },
      });

      return {
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
      };
    },
  })
);
