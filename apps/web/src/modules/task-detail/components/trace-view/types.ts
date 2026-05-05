import type {
  AgentInvocationView,
  EventInvocationsView,
  ToolCallView,
} from '@/modules/tasks/types';

export interface TraceViewProps {
  events: EventInvocationsView[];
}

export interface SelectedToolCall {
  toolCall: ToolCallView;
  invocation: AgentInvocationView;
}
