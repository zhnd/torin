import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import RelayPlugin from '@pothos/plugin-relay';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import { getDatamodel, prisma } from '@torin/database';
import type { default as PrismaTypes } from '@torin/database/pothos-types';
import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import type { Context } from './context.js';

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: Context;
  AuthScopes: {
    authenticated: boolean;
  };
  Scalars: {
    DateTime: {
      Input: Date;
      Output: Date;
    };
    Json: {
      Input: unknown;
      Output: unknown;
    };
  };
}>({
  plugins: [PrismaPlugin, RelayPlugin, ScopeAuthPlugin, SimpleObjectsPlugin],
  prisma: {
    client: prisma,
    dmmf: getDatamodel(),
    onUnusedQuery: process.env.NODE_ENV === 'development' ? 'warn' : null,
  },
  relay: {
    clientMutationId: 'omit',
    cursorType: 'String',
  },
  scopeAuth: {
    authScopes: (_ctx) => ({
      authenticated: true,
    }),
  },
});

builder.queryType({});
builder.mutationType({});

builder.addScalarType('DateTime', DateTimeResolver, {});
builder.addScalarType('Json', JSONResolver, {});
