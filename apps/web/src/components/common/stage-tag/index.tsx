// Stage label map. Single source of truth for the human-readable name
// of each pipeline stage; used wherever a stage needs a one-line label
// (event rows, stage headers, Gantt y-axis, etc.).
const STAGE_LABEL: Record<string, string> = {
  analyze: 'Analysis',
  analysis: 'Analysis',
  plan: 'Plan',
  reproduce: 'Reproduction',
  implement: 'Implementation',
  filter: 'Filter',
  critic: 'Critic',
  hitl: 'HITL',
  test: 'Test',
  pr: 'Pull request',
};

export function StageTag({ stage }: { stage: string }) {
  const label = STAGE_LABEL[stage.toLowerCase()] ?? stage;
  return (
    <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.04em] text-foreground-muted">
      {label}
    </span>
  );
}
