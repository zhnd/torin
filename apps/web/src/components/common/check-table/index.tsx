'use client';

import { Chip } from '../chip';
import { pickOutput } from './libs';
import type { FilterCheck } from './types';
import { useService } from './use-service';

export type { FilterCheck } from './types';

function CheckIcon({ passed }: { passed: boolean }) {
  return (
    <span
      className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full"
      style={{ background: passed ? 'var(--foreground)' : 'var(--danger)' }}
    >
      {passed ? (
        <svg
          width={7}
          height={7}
          viewBox="0 0 12 12"
          fill="none"
          role="img"
          aria-hidden="true"
        >
          <path
            d="M2 6.5L5 9L10 3.5"
            stroke="var(--background)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width={6}
          height={6}
          viewBox="0 0 8 8"
          fill="none"
          role="img"
          aria-hidden="true"
        >
          <path
            d="M1 1L7 7M7 1L1 7"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}

export function CheckTable({ checks }: { checks: FilterCheck[] }) {
  const { open, toggle } = useService();
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      {checks.map((c, i) => {
        const output = pickOutput(c);
        const isOpen = open === c.name;
        return (
          <div
            key={c.name}
            className={i < checks.length - 1 ? 'border-b border-border' : ''}
          >
            <button
              type="button"
              onClick={() => toggle(c.name)}
              className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-3.5 py-2.5 text-left"
            >
              <CheckIcon passed={c.passed} />
              <span className="w-22 font-mono text-[12.5px] font-medium">
                {c.name}
              </span>
              <Chip dot={c.passed ? 'var(--ok)' : 'var(--danger)'}>
                {c.passed ? 'Pass' : 'Fail'}
              </Chip>
              <span className="flex-1 truncate font-mono text-[11px] text-foreground-subtle">
                {output}
              </span>
              <span className="text-[10px] text-foreground-subtle">
                {isOpen ? '▾' : '▸'}
              </span>
            </button>
            {isOpen && output && (
              <pre className="m-0 mx-3.5 mb-3 overflow-auto rounded-[var(--radius-sm)] border border-border bg-surface-inset p-2.5 font-mono text-[11px] leading-[1.55]">
                {output}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
