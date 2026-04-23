interface SparkProps {
  values: number[];
  width?: number;
  height?: number;
  tone?: 'foreground' | 'accent';
  fill?: boolean;
}

/**
 * Minimal sparkline SVG. No axes, no tooltip — just a polyline with
 * optional area fill. Safe for mock data (0-2 values renders a dashed
 * placeholder line).
 */
export function Spark({
  values,
  width = 160,
  height = 32,
  tone = 'foreground',
  fill = false,
}: SparkProps) {
  const vs = values.filter((v) => Number.isFinite(v));
  if (vs.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        role="img"
        aria-hidden="true"
      >
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--border-strong)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      </svg>
    );
  }

  const max = Math.max(...vs);
  const min = Math.min(...vs);
  const norm = (v: number) => (max === min ? 0.5 : (v - min) / (max - min));
  const step = width / (vs.length - 1);
  const pts = vs.map(
    (v, i) => [i * step, height - norm(v) * height * 0.85 - 2] as const
  );
  const points = pts.map((p) => p.join(',')).join(' ');
  const areaPath = `M ${pts[0][0]},${height} L ${pts
    .map((p) => p.join(','))
    .join(' L ')} L ${pts[pts.length - 1][0]},${height} Z`;
  const stroke = tone === 'accent' ? 'var(--accent)' : 'var(--foreground)';
  const gid = `sg-${Math.abs(points.length * 31 + vs[0]).toString(36)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      role="img"
      aria-hidden="true"
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gid})`} />
        </>
      )}
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
