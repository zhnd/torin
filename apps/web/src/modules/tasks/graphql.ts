import { gql } from '@apollo/client';

export const TASK_FIELDS = gql`
  fragment TaskFields on Task {
    id
    type
    status
    input
    triggerSource
    error
    workflowId
    currentStageKey
    awaiting {
      stageKey
      attemptNumber
    }
    project {
      id
      name
      repositoryUrl
    }
    createdAt
    updatedAt
    startedAt
    completedAt
  }
`;

// Detail-view fragment: pulls the folded stage view (per-stage attempts +
// reviews). The events relation gives the raw rows for the events tab.
export const TASK_DETAIL_FIELDS = gql`
  fragment TaskDetailFields on Task {
    ...TaskFields
    stages {
      key
      status
      attempts {
        attemptNumber
        status
        input
        output
        error
        startedAt
        endedAt
        durationMs
        review {
          action
          feedback
          decidedBy
          decidedAt
        }
      }
    }
    events {
      id
      kind
      stageKey
      attemptNumber
      status
      input
      output
      error
      decidedBy
      startedAt
      endedAt
      durationMs
      agentInvocations {
        id
        agentName
        model
        status
        errorText
        spanId
        startedAt
        endedAt
        durationMs
        totalCostUsd
        inputTokens
        outputTokens
        turns {
          id
          turnIndex
          role
          textContent
          textTruncatedAt
          toolUseCount
          inputTokens
          outputTokens
          startedAt
        }
        toolCalls {
          id
          agentTurnId
          toolUseId
          name
          input
          output
          outputTruncatedAt
          success
          errorText
          spanId
          startedAt
          endedAt
          durationMs
        }
      }
    }
    executions {
      id
      workflowKind
      workflowVersion
      traceId
      temporalWorkflowId
      status
      startedAt
      endedAt
      durationMs
      stages {
        id
        stageName
        order
        status
        spanId
        parentSpanId
        startedAt
        endedAt
        durationMs
        attempts {
          id
          attemptNumber
          triggerKind
          triggerPayload
          spanId
          status
          startedAt
          endedAt
          durationMs
          invocations {
            id
            agentName
            model
            status
            errorText
            spanId
            startedAt
            endedAt
            durationMs
            totalCostUsd
            inputTokens
            outputTokens
            turns {
              id
              turnIndex
              role
              textContent
              textTruncatedAt
              toolUseCount
              inputTokens
              outputTokens
              startedAt
            }
            toolCalls {
              id
              agentTurnId
              toolUseId
              name
              input
              output
              outputTruncatedAt
              success
              errorText
              spanId
              startedAt
              endedAt
              durationMs
            }
          }
        }
      }
      retrospective {
        id
        summary
        bottlenecks
        recommendations
        riskFactors
        stats
        model
        costUsd
        createdAt
      }
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

export const TASK_UPDATED = gql`
  subscription TaskUpdated($id: String!) {
    taskUpdated(id: $id) {
      ...TaskDetailFields
    }
  }
  ${TASK_DETAIL_FIELDS}
`;

export const RESOLVE_DEFECT = gql`
  mutation ResolveDefect($projectId: String!, $defectDescription: String!) {
    resolveDefect(projectId: $projectId, defectDescription: $defectDescription) {
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

export const RETRY_TASK = gql`
  mutation RetryTask($taskId: String!) {
    retryTask(taskId: $taskId) {
      id
    }
  }
`;
