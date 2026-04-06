import { gql } from '@apollo/client';

export const DASHBOARD_QUERY = gql`
  query Dashboard {
    projects {
      id
      name
      repositoryUrl
    }
    tasks(status: null) {
      id
      type
      status
      repositoryUrl
      project {
        id
        name
      }
      createdAt
    }
  }
`;
