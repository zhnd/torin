import { FileCode, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import type { DiffFile } from '../../types';

interface DiffTabProps {
  files: DiffFile[];
}

export function DiffTab({ files }: DiffTabProps) {
  const [selectedFile, setSelectedFile] = useState(files[0]?.path ?? '');

  const active = files.find((f) => f.path === selectedFile);

  return (
    <div className="flex gap-4 min-h-[400px]">
      {/* File list */}
      <div className="w-56 shrink-0 rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground">
            Changed files ({files.length})
          </p>
        </div>
        <div className="divide-y divide-border">
          {files.map((file) => (
            <button
              key={file.path}
              type="button"
              onClick={() => setSelectedFile(file.path)}
              className={cn(
                'w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer',
                selectedFile === file.path ? 'bg-accent' : 'hover:bg-accent/50'
              )}
            >
              <div className="flex items-center gap-2">
                <FileCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate font-mono">
                  {file.path.split('/').pop()}
                </span>
              </div>
              <div className="mt-0.5 flex gap-2 pl-5">
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <Plus className="h-3 w-3" />
                  {file.additions}
                </span>
                <span className="text-red-500 flex items-center gap-0.5">
                  <Minus className="h-3 w-3" />
                  {file.deletions}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Diff view */}
      <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden">
        {active ? (
          <>
            <div className="px-3 py-2 border-b border-border bg-muted/30">
              <span className="text-xs font-mono text-muted-foreground">
                {active.path}
              </span>
            </div>
            <div className="overflow-auto max-h-[500px]">
              {active.hunks.map((hunk) => (
                <div key={hunk.header}>
                  <div className="bg-muted/50 px-3 py-1 text-xs font-mono text-muted-foreground border-b border-border/50">
                    {hunk.header}
                  </div>
                  {hunk.lines.map((line) => (
                    <div
                      key={`${line.type}-${line.content}`}
                      className={cn(
                        'px-3 py-0.5 text-xs font-mono whitespace-pre',
                        line.type === 'add' && 'bg-emerald-50 text-emerald-800',
                        line.type === 'remove' && 'bg-red-50 text-red-800'
                      )}
                    >
                      <span className="inline-block w-4 text-muted-foreground select-none">
                        {line.type === 'add'
                          ? '+'
                          : line.type === 'remove'
                            ? '-'
                            : ' '}
                      </span>
                      {line.content}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a file to view diff
          </div>
        )}
      </div>
    </div>
  );
}
