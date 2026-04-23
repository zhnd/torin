import { gql } from '@apollo/client';

export const TASK_FIELDS = gql`
  fragment TaskFields on Task {
    id
    type
    status
    repositoryUrl
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
    result
    project {
      id
      name
    }
    createdAt
    updatedAt
  }
`;

// Structured trace tree — loaded on detail view only to avoid
// pulling tool-output text (up to 32 KB each) into list queries.
export const TASK_DETAIL_FIELDS = gql`
  fragment TaskDetailFields on Task {
    ...TaskFields
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
          samples {
            id
            sampleIndex
            branch
            summary
            filesChanged
            patch
            additions
            deletions
            filterPassed
            filterChecks
            criticApproved
            criticScore
            criticConcerns
            selected
            createdAt
          }
        }
        reviews {
          id
          decisionType
          action
          feedback
          userId
          createdAt
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
    samples {
      id
      attemptExecutionId
      sampleIndex
      branch
      selected
      criticScore
      filterPassed
      createdAt
    }
    reviews {
      id
      stageExecutionId
      action
      feedback
      userId
      createdAt
    }
    resultRecord {
      id
      workflowKind
      payload
    }
    events {
      id
      eventType
      payload
      workflowExecutionId
      stageExecutionId
      attemptExecutionId
      traceId
      spanId
      occurredAt
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
