import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../../packages/graphql-schema/schema.graphql',
  documents: ['src/**/*.tsx', 'src/**/*.ts'],
  generates: {
    './src/__generated__/': {
      preset: 'client',
      config: {
        documentMode: 'string',
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
