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
    previewCommand: t.exposeString('previewCommand', { nullable: true }),
    previewPort: t.exposeInt('previewPort', { nullable: true }),
    previewReadyPattern: t.exposeString('previewReadyPattern', {
      nullable: true,
    }),
    tasks: t.relation('tasks'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});
