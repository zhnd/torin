import { builder } from '../../../infrastructure/graphql/builder.js';

export const UpdateProjectInput = builder.inputType('UpdateProjectInput', {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string(),
    repositoryUrl: t.string(),
    credentials: t.string({ description: 'GitHub personal access token' }),
    previewCommand: t.string(),
    previewPort: t.int(),
    previewReadyPattern: t.string(),
  }),
});
