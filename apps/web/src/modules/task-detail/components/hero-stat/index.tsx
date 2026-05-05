/**
 * Compact stat tile used in the task-detail hero (DURATION / COST /
 * TOKENS row). Mono font, uppercase label, tabular numerals.
 */
export function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-19 whitespace-nowrap px-3 py-1.75 text-center">
      <div className="font-mono text-[9.5px] font-medium uppercase tracking-[0.08em] text-foreground-subtle">
        {label}
      </div>
      <div className="mt-1 font-mono text-[16px] font-medium leading-none tabular-nums tracking-normal text-foreground">
        {value}
      </div>
    </div>
  );
}
