'use client';

import { PatchDiff } from '@pierre/diffs/react';
import { FileTree } from '@pierre/trees/react';
import { buildPatchForFile } from './libs';
import type { DiffWithTreeProps } from './types';
import { useService } from './use-service';

/**
 * Two-pane diff viewer: file tree on the left (Pierre `<FileTree>`),
 * PatchDiff for the selected file on the right. Useful when many files
 * change and a flat stacked patch would be unwieldy.
 *
 * Falls back to a centered empty state when there are no files; falls
 * back to a single PatchDiff (no tree) when there's exactly one file.
 */
export function DiffWithTree({ files }: DiffWithTreeProps) {
  const svc = useService(files);

  if (!svc.hasFiles) {
    return (
      <div className="rounded-md border border-dashed border-border bg-surface px-4 py-8 text-center text-[12.5px] text-foreground-muted">
        No diff recorded.
      </div>
    );
  }

  if (files.length === 1) {
    return <PatchDiff patch={buildPatchForFile(files[0])} disableWorkerPool />;
  }

  return (
    <div className="grid min-h-100 overflow-hidden rounded-md border border-border bg-surface md:grid-cols-[220px_1fr]">
      <div className="max-h-150 overflow-auto border-b border-border md:border-r md:border-b-0">
        <FileTree model={svc.model} />
      </div>
      <div className="min-w-0 overflow-auto">
        {svc.selectedFile ? (
          <PatchDiff
            patch={buildPatchForFile(svc.selectedFile)}
            disableWorkerPool
          />
        ) : (
          <div className="px-4 py-8 text-center text-[12.5px] text-foreground-muted">
            Select a file from the tree.
          </div>
        )}
      </div>
    </div>
  );
}
