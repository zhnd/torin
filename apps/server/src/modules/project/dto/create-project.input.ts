import { builder } from '../../../infrastructure/graphql/builder.js';

export const CreateProjectInput = builder.inputType('CreateProjectInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    repositoryUrl: t.string({ required: true }),
    credentials: t.string({ description: 'GitHub personal access token' }),
  }),
});
