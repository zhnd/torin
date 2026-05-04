import type {
  AgentInvocationView,
  ExecutionView,
  ToolCallView,
} from '@/modules/tasks/types';

export interface TraceViewProps {
  execution: ExecutionView | null;
}

export interface SelectedToolCall {
  toolCall: ToolCallView;
  invocation: AgentInvocationView;
}
