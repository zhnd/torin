import type { Lane, LaneMeta } from './types';

export const LANES: Record<Lane, LaneMeta> = {
  approve: {
    label: 'Approve',
    dot: 'var(--ok)',
    desc: 'Create a pull request on main',
    descAnalyze: 'Proceed to reproduce + implement',
    cta: 'Approve and open PR',
    ctaAnalyze: 'Approve analysis',
    keyHint: 'A',
    placeholder: 'Add any notes for the agent (optional)…',
    required: false,
  },
  request_changes: {
    label: 'Request changes',
    dot: 'var(--warn)',
    desc: 'Agent re-implements with your feedback',
    descAnalyze: 'Agent refines the plan with your feedback',
    cta: 'Send feedback',
    ctaAnalyze: 'Send feedback',
    keyHint: 'R',
    placeholder:
      'What needs to change? Be specific — the agent will use this as prior-attempt feedback.',
    required: true,
    minChars: 12,
  },
  reject: {
    label: 'Reject',
    dot: 'var(--danger)',
    desc: 'Close the task — no further agent work',
    descAnalyze: 'Close the task — abandon this fix',
    cta: 'Reject and close',
    ctaAnalyze: 'Reject and close',
    keyHint: 'X',
    placeholder: 'Why are you rejecting this? (required for audit log)',
    required: true,
    minChars: 8,
  },
};
