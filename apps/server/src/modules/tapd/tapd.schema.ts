import { builder } from '../../infrastructure/graphql/builder.js';

/**
 * Status of the calling user's Tapd configuration. Never includes the
 * raw secret. `tapdNick` is discovered server-side via the credential
 * probe so the UI can render "Connected as @nick" without ever asking
 * the user to type it.
 */
export const TapdCredentialStatus = builder
  .objectRef<{
    configured: boolean;
    tapdNick: string | null;
  }>('TapdCredentialStatus')
  .implement({
    fields: (t) => ({
      configured: t.boolean({ resolve: (p) => p.configured }),
      tapdNick: t.string({
        nullable: true,
        resolve: (p) => p.tapdNick,
      }),
    }),
  });

/** Slim Tapd bug shape used by the inbox + trigger dialog. */
export const TapdBug = builder
  .objectRef<{
    id: string;
    workspaceId: string;
    workspaceName: string | null;
    title: string;
    description: string;
    status: string;
    priority: string | null;
    currentOwner: string | null;
    url: string;
    createdAt: string;
  }>('TapdBug')
  .implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      workspaceId: t.exposeString('workspaceId'),
      workspaceName: t.exposeString('workspaceName', { nullable: true }),
      title: t.exposeString('title'),
      description: t.exposeString('description'),
      status: t.exposeString('status'),
      priority: t.exposeString('priority', { nullable: true }),
      currentOwner: t.exposeString('currentOwner', { nullable: true }),
      url: t.exposeString('url'),
      createdAt: t.exposeString('createdAt'),
    }),
  });

builder.prismaObject('TapdWorkspaceProjectMap', {
  name: 'TapdWorkspaceProjectMap',
  fields: (t) => ({
    id: t.exposeID('id'),
    workspaceId: t.exposeString('workspaceId'),
    projectId: t.exposeString('projectId'),
    project: t.relation('project'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});
