export type Lane = 'approve' | 'request_changes' | 'reject';

export interface LaneMeta {
  label: string;
  dot: string;
  desc: string;
  descAnalyze: string;
  cta: string;
  ctaAnalyze: string;
  keyHint: string;
  placeholder: string;
  required: boolean;
  minChars?: number;
}

export type ReviewFormVariant = 'hitl' | 'analyze';

export interface ReviewSubmitPayload {
  lane: Lane;
  feedback: string;
}
