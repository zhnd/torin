import { useState } from 'react';
import { LANES } from './constants';
import { hasMinFeedback } from './libs';
import type { Lane, ReviewSubmitPayload } from './types';

interface UseServiceInput {
  onSubmit?: (payload: ReviewSubmitPayload) => void;
}

export function useService({ onSubmit }: UseServiceInput) {
  const [lane, setLane] = useState<Lane | null>(null);
  const [feedback, setFeedback] = useState('');

  const curLane = lane ? LANES[lane] : null;
  const feedbackLen = feedback.trim().length;
  const canSubmit = hasMinFeedback(curLane, feedback);

  function discard() {
    setLane(null);
    setFeedback('');
  }

  function submit() {
    if (!lane || !canSubmit) return;
    onSubmit?.({ lane, feedback });
  }

  return {
    lane,
    setLane,
    feedback,
    setFeedback,
    curLane,
    feedbackLen,
    canSubmit,
    discard,
    submit,
  };
}
