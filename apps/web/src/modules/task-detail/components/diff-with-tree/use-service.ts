'use client';

import { useFileTree, useFileTreeSelection } from '@pierre/trees/react';
import { useMemo } from 'react';
import type { DiffFile } from './types';

/**
 * Owns the FileTree model + derives the selected file's patch.
 *
 * - Tree paths come from `files[*].file` so each diff entry maps to one
 *   tree row; directories are inferred by Pierre from path segments.
 * - The first file is initially selected so PatchDiff has something to
 *   render on first paint.
 * - `selectedFile` follows the tree's current selection (last path when
 *   multi-select happens, first file otherwise as fallback).
 */
export function useService(files: DiffFile[]) {
  const paths = useMemo(() => files.map((f) => f.file), [files]);
  const initialSelected = useMemo(() => (paths[0] ? [paths[0]] : []), [paths]);

  const { model } = useFileTree({
    paths,
    initialSelectedPaths: initialSelected,
    initialExpansion: 'open',
  });

  const selectedPaths = useFileTreeSelection(model);
  const selectedPath = selectedPaths[0] ?? paths[0] ?? null;
  const selectedFile = useMemo(
    () => (selectedPath ? files.find((f) => f.file === selectedPath) : null),
    [files, selectedPath]
  );

  return { model, selectedFile, hasFiles: files.length > 0 };
}
