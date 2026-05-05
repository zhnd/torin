import { builder } from '../../../infrastructure/graphql/builder.js';

export const SetTapdCredentialInput = builder.inputType(
  'SetTapdCredentialInput',
  {
    fields: (t) => ({
      accessToken: t.string({
        required: true,
        description:
          'Tapd Personal Access Token. Created in Tapd → 我的设置 → 个人访问令牌.',
      }),
    }),
  }
);
