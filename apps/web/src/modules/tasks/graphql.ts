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
    project {
      id
      name
    }
    createdAt
    updatedAt
  }
`;

export const GET_TASKS = gql`
  ${TASK_FIELDS}
  query GetTasks($status: String, $projectId: String) {
    tasks(status: $status, projectId: $projectId) {
      ...TaskFields
    }
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
