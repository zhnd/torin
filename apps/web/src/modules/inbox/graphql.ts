import { gql } from '@apollo/client';

/**
 * Inbox query — same shape as the dashboard summary because the inbox
 * is a focused view of the same data. Kept as a separate query so the
 * inbox module owns its data contract.
 */
export const INBOX_QUERY = gql`
  query Inbox {
    tasks(status: null) {
      id
      type
      status
      currentStageKey
      awaiting {
        stageKey
        attemptNumber
      }
      createdAt
      updatedAt
      project {
        id
        name
      }
    }
  }
`;
