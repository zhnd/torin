import { gql } from '@apollo/client';

export const TAPD_INBOX_QUERY = gql`
  query TapdInbox {
    tapdCredentialStatus {
      configured
      tapdNick
    }
    tapdAssignedBugs {
      id
      workspaceId
      workspaceName
      title
      description
      status
      priority
      currentOwner
      url
      createdAt
    }
    tapdWorkspaceMappings {
      workspaceId
      projectId
      project {
        id
        name
        repositoryUrl
      }
    }
    projects {
      id
      name
      repositoryUrl
    }
  }
`;

export const PROJECT_BRANCHES_QUERY = gql`
  query ProjectBranches($projectId: String!) {
    projectBranches(projectId: $projectId)
  }
`;

export const SET_TAPD_WORKSPACE_PROJECT_MAP = gql`
  mutation InboxSetTapdWorkspaceProjectMap(
    $workspaceId: String!
    $projectId: String!
  ) {
    setTapdWorkspaceProjectMap(
      workspaceId: $workspaceId
      projectId: $projectId
    ) {
      id
      workspaceId
      projectId
      project {
        id
        name
        repositoryUrl
      }
    }
  }
`;
