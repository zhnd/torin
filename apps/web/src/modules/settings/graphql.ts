import { gql } from '@apollo/client';

export const TAPD_SETTINGS = gql`
  query TapdSettings {
    tapdCredentialStatus {
      configured
      tapdNick
    }
  }
`;

export const SET_TAPD_CREDENTIAL = gql`
  mutation SetTapdCredential($input: SetTapdCredentialInput!) {
    setTapdCredential(input: $input) {
      configured
      tapdNick
    }
  }
`;

export const REMOVE_TAPD_CREDENTIAL = gql`
  mutation RemoveTapdCredential {
    removeTapdCredential
  }
`;
