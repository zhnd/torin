const STAGE_ABBR: Record<string, string> = {
  analyze: 'ANL',
  analysis: 'ANL',
  plan: 'PLN',
  reproduce: 'RPR',
  implement: 'IMP',
  filter: 'FIL',
  critic: 'CRT',
  hitl: 'RVW',
  test: 'TST',
  pr: ' PR',
};

export function StageTag({ stage }: { stage: string }) {
  const label = STAGE_ABBR[stage] ?? stage.slice(0, 3).toUpperCase();
  return (
    <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.02em] text-foreground-muted">
      {label}
    </span>
  );
}
