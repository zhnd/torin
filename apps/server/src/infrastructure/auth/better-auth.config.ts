import { prisma } from '@torin/database';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:4000',
  secret:
    process.env.BETTER_AUTH_SECRET || 'dev-secret-key-change-in-production',

  trustedOrigins: [process.env.WEB_URL || 'http://localhost:3000'],

  appName: '@torin/server',

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectURI: `${process.env.BETTER_AUTH_URL || 'http://localhost:4000'}/api/auth/callback/google`,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  advanced: {
    cookies: {
      sessionToken: {
        attributes: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        },
      },
    },
  },

  plugins: [],
});

export default auth;
