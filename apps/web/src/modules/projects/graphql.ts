import { gql } from '@apollo/client';

export const PROJECT_FIELDS = gql`
  fragment ProjectFields on Project {
    id
    name
    repositoryUrl
    authMethod
    hasCredentials
    createdAt
    updatedAt
  }
`;

export const GET_PROJECTS = gql`
  ${PROJECT_FIELDS}
  query GetProjects {
    projects {
      ...ProjectFields
    }
  }
`;

export const GET_PROJECT = gql`
  ${PROJECT_FIELDS}
  query GetProject($id: String!) {
    project(id: $id) {
      ...ProjectFields
      tasks {
        id
        type
        status
        repositoryUrl
        createdAt
      }
    }
  }
`;

export const CREATE_PROJECT = gql`
  ${PROJECT_FIELDS}
  mutation CreateProject($name: String!, $repositoryUrl: String!) {
    createProject(name: $name, repositoryUrl: $repositoryUrl) {
      ...ProjectFields
    }
  }
`;

export const UPDATE_PROJECT = gql`
  ${PROJECT_FIELDS}
  mutation UpdateProject($id: String!, $name: String, $repositoryUrl: String) {
    updateProject(id: $id, name: $name, repositoryUrl: $repositoryUrl) {
      ...ProjectFields
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: String!) {
    deleteProject(id: $id)
  }
`;

export const ANALYZE_REPOSITORY = gql`
  mutation AnalyzeRepository($projectId: String!) {
    analyzeRepository(projectId: $projectId) {
      id
      status
    }
  }
`;
