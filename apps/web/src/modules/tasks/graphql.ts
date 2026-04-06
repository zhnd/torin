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
    currentStage
    stages
    totalCostUsd
    inputTokens
    outputTokens
    durationMs
    model
    costBreakdown
    project {
      id
      name
    }
    createdAt
    updatedAt
  }
`;

export const TASK_DETAIL_FIELDS = gql`
  fragment TaskDetailFields on Task {
    ...TaskFields
    events {
      id
      stage
      event
      level
      agent
      tool
      details
      timestamp
    }
  }
  ${TASK_FIELDS}
`;

export const GET_TASKS = gql`
  query GetTasks($status: String, $projectId: String) {
    tasks(status: $status, projectId: $projectId) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`;

export const GET_TASK = gql`
  query GetTask($id: String!) {
    task(id: $id) {
      ...TaskDetailFields
    }
  }
  ${TASK_DETAIL_FIELDS}
`;

export const FIX_BUG = gql`
  mutation FixBug($projectId: String!, $bugDescription: String!) {
    fixBug(projectId: $projectId, bugDescription: $bugDescription) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`;

export const REVIEW_TASK = gql`
  mutation ReviewTask($taskId: String!, $action: String!, $feedback: String) {
    reviewTask(taskId: $taskId, action: $action, feedback: $feedback) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`;
