import { useState } from 'react';
import type { SelectedToolCall } from './types';

export function useService() {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedInvocations, setExpandedInvocations] = useState<
    Record<string, boolean>
  >({});
  const [selectedToolCall, setSelectedToolCall] =
    useState<SelectedToolCall | null>(null);

  function toggleStage(id: string) {
    setExpandedStages((prev) => ({ ...prev, [id]: !prev[id] }));
  }
  function toggleInvocation(id: string) {
    setExpandedInvocations((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return {
    expandedStages,
    expandedInvocations,
    selectedToolCall,
    toggleStage,
    toggleInvocation,
    setSelectedToolCall,
  };
}
