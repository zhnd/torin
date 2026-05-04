import { cn } from '@/utils/cn';

interface AvatarStackProps {
  /** Names — first letter is rendered as initial. */
  names: string[];
  size?: 'xs' | 'sm';
  className?: string;
}

const SWATCHES = [
  'oklch(0.55 0.13 90)', // ochre
  'oklch(0.6 0.13 145)', // sage
  'oklch(0.65 0.15 50)', // warm orange
  'oklch(0.5 0.1 230)', // dusty blue
  'oklch(0.6 0.18 30)', // terracotta
  'oklch(0.55 0.08 290)', // muted plum
];

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return SWATCHES[h % SWATCHES.length];
}

/**
 * Overlapping-circle avatar stack — used in dashboard panels to credit
 * who/what is involved (e.g. "agents engaged"). Letters render at high
 * contrast, edges have a thin paper-coloured ring to separate them.
 */
export function AvatarStack({
  names,
  size = 'sm',
  className,
}: AvatarStackProps) {
  const dim = size === 'xs' ? 16 : 22;
  const fontSize = size === 'xs' ? 9 : 11;
  return (
    <div className={cn('flex items-center', className)}>
      {names.map((n, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: caller passes a fixed names[] per render; index disambiguates duplicates
          key={`${n}-${i}`}
          className="-ml-1.5 inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-card first:ml-0"
          style={{
            width: dim,
            height: dim,
            fontSize,
            background: colorFor(n),
          }}
          title={n}
        >
          {n.charAt(0).toUpperCase()}
        </span>
      ))}
    </div>
  );
}
