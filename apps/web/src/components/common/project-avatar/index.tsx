const GLYPHS: Record<string, string> = {
  'billing-service': '※',
  'worker-runtime': '◎',
  storefront: '◈',
  analytics: '◢',
  integrations: '⌘',
  'api-gateway': '∆',
  'search-index': '◉',
};

/**
 * Monogram-style project avatar: a glyph picked by project name (with
 * fallback to a neutral diamond), enclosed in a subtle rounded square.
 */
export function ProjectAvatar({
  name,
  size = 36,
}: {
  name: string;
  size?: number;
}) {
  const glyph = GLYPHS[name] ?? '◇';
  const fontSize = Math.round(size * 0.44);
  const radius = Math.round(size * 0.22);
  return (
    <div
      className="flex shrink-0 items-center justify-center border border-border-strong bg-transparent text-foreground-muted"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize,
        lineHeight: 1,
      }}
    >
      <span style={{ transform: 'translateY(-1px)' }}>{glyph}</span>
    </div>
  );
}
