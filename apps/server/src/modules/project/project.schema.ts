import { builder } from '../../infrastructure/graphql/builder.js';

builder.prismaObject('Project', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    repositoryUrl: t.exposeString('repositoryUrl'),
    authMethod: t.exposeString('authMethod'),
    hasCredentials: t.boolean({
      resolve: (project) => !!project.encryptedCredentials,
    }),
    tasks: t.relation('tasks'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});
