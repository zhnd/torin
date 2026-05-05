import { cn } from '@/utils/cn';
import { DETAIL_TABS } from '../../constants';
import type { DetailTab } from '../../types';

export function DetailTabsBar({
  tab,
  onChange,
}: {
  tab: DetailTab;
  onChange: (t: DetailTab) => void;
}) {
  return (
    <div className="-mb-px flex gap-0.5">
      {DETAIL_TABS.map(([k, l]) => {
        const active = tab === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={cn(
              '-mb-px relative cursor-pointer border-none bg-transparent px-3 py-2.5 text-[12px] transition-colors',
              active
                ? 'font-semibold text-foreground'
                : 'font-medium text-foreground-muted hover:text-foreground'
            )}
          >
            {l}
            {active && (
              <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}
