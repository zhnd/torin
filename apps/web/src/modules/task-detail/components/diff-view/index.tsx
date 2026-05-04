'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/utils/cn';

interface ParsedRow {
  kind: 'ctx' | 'add' | 'del';
  text: string;
}

interface ParsedHunk {
  header: string;
  context: string;
  oldStart: number;
  newStart: number;
  rows: ParsedRow[];
}

interface ParsedFile {
  path: string;
  isNew: boolean;
  isDeleted: boolean;
  added: number;
  removed: number;
  hunks: ParsedHunk[];
}

/**
 * Parse a multi-file unified diff into structured form.
 * Handles `--- /dev/null`, `+++ /dev/null`, `a/` / `b/` prefixes.
 */
function parseDiff(patch: string): ParsedFile[] {
  const lines = patch.split('\n');
  const files: ParsedFile[] = [];
  let cur: ParsedFile | null = null;
  let hunk: ParsedHunk | null = null;

  for (const ln of lines) {
    if (ln.startsWith('--- ')) {
      if (cur) files.push(cur);
      cur = {
        path: '',
        isNew: ln === '--- /dev/null',
        isDeleted: false,
        added: 0,
        removed: 0,
        hunks: [],
      };
      hunk = null;
    } else if (ln.startsWith('+++ ')) {
      if (!cur) continue;
      const p = ln.slice(4);
      if (p === '/dev/null') cur.isDeleted = true;
      cur.path = p.replace(/^[ab]\//, '');
    } else if (ln.startsWith('@@')) {
      const m = ln.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)/);
      hunk = {
        header: ln,
        context: m ? m[3].trim() : '',
        oldStart: m ? parseInt(m[1], 10) : 1,
        newStart: m ? parseInt(m[2], 10) : 1,
        rows: [],
      };
      if (cur) cur.hunks.push(hunk);
    } else if (hunk && cur) {
      if (ln.startsWith('+')) {
        hunk.rows.push({ kind: 'add', text: ln.slice(1) });
        cur.added++;
      } else if (ln.startsWith('-')) {
        hunk.rows.push({ kind: 'del', text: ln.slice(1) });
        cur.removed++;
      } else {
        hunk.rows.push({
          kind: 'ctx',
          text: ln.startsWith(' ') ? ln.slice(1) : ln,
        });
      }
    }
  }
  if (cur) files.push(cur);
  return files;
}

/**
 * Rich unified-diff viewer: toolbar (file count + stats + mode toggle),
 * optional file tree sidebar when >1 files, colored line-by-line
 * rendering with gutter line numbers. Split mode pairs dels/adds side
 * by side.
 */
export function DiffView({ patch }: { patch: string }) {
  const files = useMemo(() => parseDiff(patch), [patch]);
  const [activePath, setActivePath] = useState<string | null>(
    files[0]?.path ?? null
  );
  const [mode, setMode] = useState<'unified' | 'split'>('unified');
  const [wrap, setWrap] = useState(false);

  if (files.length === 0) return null;
  const file = files.find((f) => f.path === activePath) ?? files[0];

  const totalAdd = files.reduce((s, f) => s + f.added, 0);
  const totalDel = files.reduce((s, f) => s + f.removed, 0);

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5 border-b border-border bg-surface-2 px-3.5 py-2 text-[11.5px]">
        <span className="text-foreground-muted">
          {files.length} {files.length === 1 ? 'file' : 'files'} changed
        </span>
        <span className="text-foreground-subtle">·</span>
        <span className="font-mono text-[color:var(--ok)]">+{totalAdd}</span>
        <span className="font-mono text-[color:var(--danger)]">
          −{totalDel}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setWrap((w) => !w)}
          title="Toggle word wrap"
          className="cursor-pointer border-none bg-transparent px-2 py-0.5 text-[11px] text-foreground-muted hover:text-foreground"
        >
          {wrap ? '↵ Wrap' : '⇥ No wrap'}
        </button>
        <div className="flex gap-0.5 rounded-[var(--radius-sm)] border border-border bg-surface p-0.5">
          {(['unified', 'split'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setMode(k)}
              className={cn(
                'cursor-pointer rounded-[calc(var(--radius-sm)-2px)] border-none px-2 py-0.5 text-[11px] transition-colors',
                mode === k
                  ? 'bg-surface-2 font-semibold text-foreground'
                  : 'bg-transparent font-medium text-foreground-muted hover:text-foreground'
              )}
            >
              {k === 'unified' ? 'Unified' : 'Split'}
            </button>
          ))}
        </div>
      </div>

      <div
        className="grid min-h-50"
        style={{
          gridTemplateColumns: files.length > 1 ? '200px 1fr' : '1fr',
        }}
      >
        {/* File sidebar */}
        {files.length > 1 && (
          <div className="max-h-130 overflow-y-auto border-r border-border bg-surface py-1.5">
            {files.map((f) => {
              const active = f.path === activePath;
              const short = f.path.split('/').slice(-2).join('/');
              const glyph = f.isNew ? '+' : f.isDeleted ? '−' : '◦';
              const glyphColor = f.isNew
                ? 'var(--ok)'
                : f.isDeleted
                  ? 'var(--danger)'
                  : 'var(--foreground-subtle)';
              return (
                <button
                  key={f.path}
                  type="button"
                  onClick={() => setActivePath(f.path)}
                  title={f.path}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border-none px-2 py-1.5 text-left font-mono text-[11px] text-foreground transition-colors',
                    active
                      ? 'bg-surface-2 font-semibold'
                      : 'bg-transparent font-medium hover:bg-surface-2'
                  )}
                >
                  <span
                    className="w-3 shrink-0 text-center text-[10px]"
                    style={{ color: glyphColor }}
                  >
                    {glyph}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{short}</span>
                  <span className="flex shrink-0 gap-1 text-[9.5px]">
                    <span className="text-[color:var(--ok)]">+{f.added}</span>
                    <span className="text-[color:var(--danger)]">
                      −{f.removed}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Diff body */}
        <div className="min-w-0 overflow-auto">
          <div className="flex items-center gap-2.5 border-b border-border bg-surface-2 px-3.5 py-2 font-mono text-[11.5px] text-foreground-muted">
            <span>
              {file.isNew
                ? '✨ new file'
                : file.isDeleted
                  ? '🗑 deleted'
                  : '✎ modified'}
            </span>
            <span>{file.path}</span>
          </div>
          {mode === 'unified' ? (
            <UnifiedDiff file={file} wrap={wrap} />
          ) : (
            <SplitDiff file={file} wrap={wrap} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Unified mode ─────────────────────────────────────────────────────

function UnifiedDiff({ file, wrap }: { file: ParsedFile; wrap: boolean }) {
  return (
    <div className="font-mono text-[12px] leading-[1.55]">
      {file.hunks.map((h, hi) => {
        let oldLn = h.oldStart;
        let newLn = h.newStart;
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: hunks are ordered and never reordered
            key={hi}
          >
            <HunkHeader
              context={h.context}
              oldStart={h.oldStart}
              first={hi === 0}
            />
            {h.rows.map((r, i) => {
              let a: number | null = null;
              let b: number | null = null;
              if (r.kind === 'del') {
                a = oldLn++;
              } else if (r.kind === 'add') {
                b = newLn++;
              } else {
                a = oldLn++;
                b = newLn++;
              }
              const bg =
                r.kind === 'add'
                  ? 'color-mix(in oklch, var(--ok) 12%, transparent)'
                  : r.kind === 'del'
                    ? 'color-mix(in oklch, var(--danger) 10%, transparent)'
                    : 'transparent';
              const mark =
                r.kind === 'add' ? '+' : r.kind === 'del' ? '−' : ' ';
              const color =
                r.kind === 'add'
                  ? 'var(--ok)'
                  : r.kind === 'del'
                    ? 'var(--danger)'
                    : 'var(--foreground)';
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable line order in unified diff
                  key={`${hi}-${i}`}
                  className="flex"
                  style={{ background: bg }}
                >
                  <Gutter>{a ?? ''}</Gutter>
                  <Gutter>{b ?? ''}</Gutter>
                  <span
                    className="w-3.5 shrink-0 select-none text-center"
                    style={{ color }}
                  >
                    {mark}
                  </span>
                  <span
                    className="flex-1 px-2.5"
                    style={{
                      whiteSpace: wrap ? 'pre-wrap' : 'pre',
                      wordBreak: wrap ? 'break-word' : 'normal',
                      color: r.kind === 'ctx' ? 'var(--foreground)' : color,
                    }}
                  >
                    {r.text || ' '}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Split mode ───────────────────────────────────────────────────────

interface SplitCell {
  ln: number;
  text: string;
  kind: 'ctx' | 'add' | 'del';
}

function SplitDiff({ file, wrap }: { file: ParsedFile; wrap: boolean }) {
  return (
    <div className="font-mono text-[12px] leading-[1.55]">
      {file.hunks.map((h, hi) => {
        const pairs: Array<{
          left: SplitCell | null;
          right: SplitCell | null;
        }> = [];
        let oldLn = h.oldStart;
        let newLn = h.newStart;
        let i = 0;
        while (i < h.rows.length) {
          const r = h.rows[i];
          if (r.kind === 'ctx') {
            pairs.push({
              left: { ln: oldLn++, text: r.text, kind: 'ctx' },
              right: { ln: newLn++, text: r.text, kind: 'ctx' },
            });
            i++;
          } else if (r.kind === 'del') {
            const dels: ParsedRow[] = [];
            while (i < h.rows.length && h.rows[i].kind === 'del') {
              dels.push(h.rows[i]);
              i++;
            }
            const adds: ParsedRow[] = [];
            while (i < h.rows.length && h.rows[i].kind === 'add') {
              adds.push(h.rows[i]);
              i++;
            }
            const n = Math.max(dels.length, adds.length);
            for (let j = 0; j < n; j++) {
              pairs.push({
                left: dels[j]
                  ? { ln: oldLn++, text: dels[j].text, kind: 'del' }
                  : null,
                right: adds[j]
                  ? { ln: newLn++, text: adds[j].text, kind: 'add' }
                  : null,
              });
            }
          } else {
            pairs.push({
              left: null,
              right: { ln: newLn++, text: r.text, kind: 'add' },
            });
            i++;
          }
        }
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: hunks are ordered and never reordered
            key={hi}
          >
            <HunkHeader
              context={h.context}
              oldStart={h.oldStart}
              first={hi === 0}
            />
            {pairs.map((p, pi) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: stable pair order in split diff
                key={`${hi}-${pi}`}
                className="grid grid-cols-2"
              >
                <SplitHalf cell={p.left} wrap={wrap} side="left" />
                <SplitHalf cell={p.right} wrap={wrap} side="right" />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function SplitHalf({
  cell,
  wrap,
  side,
}: {
  cell: SplitCell | null;
  wrap: boolean;
  side: 'left' | 'right';
}) {
  const bg = !cell
    ? 'var(--surface-2)'
    : cell.kind === 'add'
      ? 'color-mix(in oklch, var(--ok) 12%, transparent)'
      : cell.kind === 'del'
        ? 'color-mix(in oklch, var(--danger) 10%, transparent)'
        : 'transparent';
  const color = !cell
    ? 'transparent'
    : cell.kind === 'add'
      ? 'var(--ok)'
      : cell.kind === 'del'
        ? 'var(--danger)'
        : 'var(--foreground)';
  return (
    <div
      className="flex min-h-[1.55em]"
      style={{
        background: bg,
        borderRight: side === 'left' ? '1px solid var(--border)' : undefined,
      }}
    >
      <Gutter>{cell?.ln ?? ''}</Gutter>
      <span
        className="flex-1 px-2.5"
        style={{
          color,
          whiteSpace: wrap ? 'pre-wrap' : 'pre',
          wordBreak: wrap ? 'break-word' : 'normal',
        }}
      >
        {cell?.text ?? ''}
      </span>
    </div>
  );
}

// ── Small atoms ──────────────────────────────────────────────────────

function HunkHeader({
  context,
  oldStart,
  first,
}: {
  context: string;
  oldStart: number;
  first: boolean;
}) {
  return (
    <div
      className={cn(
        'px-3.5 py-1 text-[11px] text-foreground-subtle',
        !first && 'border-t border-dashed border-border'
      )}
      style={{
        background: 'color-mix(in oklch, var(--accent) 6%, transparent)',
      }}
    >
      @@ {context || `line ${oldStart}`}
    </div>
  );
}

function Gutter({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-9 shrink-0 select-none border-r border-border px-2 text-right text-[10.5px] text-foreground-subtle">
      {children}
    </span>
  );
}
