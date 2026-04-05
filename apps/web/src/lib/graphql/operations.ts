import { gql } from '@apollo/client';

export const TASK_FIELDS = gql`
  fragment TaskFields on Task {
    id
    type
    status
    repositoryUrl
    result
    error
    workflowId
    createdAt
    updatedAt
  }
`;

export const GET_TASK = gql`
  ${TASK_FIELDS}
  query GetTask($id: String!) {
    task(id: $id) {
      ...TaskFields
    }
  }
`;

export const ANALYZE_REPOSITORY = gql`
  ${TASK_FIELDS}
  mutation AnalyzeRepository($url: String!) {
    analyzeRepository(url: $url) {
      ...TaskFields
    }
  }
`;
