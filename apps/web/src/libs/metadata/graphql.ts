import { gql } from '@apollo/client';

export const GET_METADATA = gql`
  query GetMetadata {
    workflowDefinitions {
      id
      kind
      displayName
      version
      stages {
        id
        name
        label
        order
        allowsRetry
        allowsHitl
      }
    }
    taskStatusOptions {
      value
      label
    }
    taskTypeOptions {
      value
      label
    }
  }
`;
