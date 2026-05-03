'use client';

import { Streamdown } from 'streamdown';
import { cn } from '@/utils/cn';

interface MarkdownProps {
  children: string | null | undefined;
  className?: string;
}

/**
 * Renders LLM-emitted markdown. Backed by streamdown, which handles
 * GFM (tables, task lists, fenced code), code highlighting via Shiki,
 * and incomplete markdown gracefully (future-proof for streaming).
 *
 * Layout defaults match the surrounding text-[14px] body copy in the
 * detail page; pass `className` to tweak per-section.
 */
export function Markdown({ children, className }: MarkdownProps) {
  if (!children) return null;
  return (
    <Streamdown
      className={cn(
        'text-[14px] leading-[1.6] text-foreground',
        // Vertical rhythm: tight first/last so it sits flush in <Section>.
        '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        // Inline code
        '[&_code]:rounded-sm [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px]',
        // Fenced code blocks (Shiki applies its own theme inside <pre>).
        '[&_pre]:my-3 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-surface-inset [&_pre]:p-3 [&_pre]:text-[12px] [&_pre]:leading-[1.55]',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[12px]',
        // Lists
        '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5',
        '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_li]:my-1',
        // Headings — keep modest, this content is embedded inside Section labels.
        '[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-[15.5px] [&_h1]:font-semibold',
        '[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-[14.5px] [&_h2]:font-semibold',
        '[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-[13.5px] [&_h3]:font-semibold',
        // Block quotes
        '[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-foreground-muted',
        // Tables — GFM
        '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[13px]',
        '[&_th]:border [&_th]:border-border [&_th]:bg-surface-2 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold',
        '[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5',
        // Links
        '[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-foreground-muted',
        // Paragraphs
        '[&_p]:my-2',
        className
      )}
    >
      {children}
    </Streamdown>
  );
}
