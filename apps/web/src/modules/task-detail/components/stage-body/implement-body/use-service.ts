'use client';

import { useState } from 'react';

interface SampleSummary {
  id: string;
  status: string;
}

/**
 * Tracks which sample's diff is currently selected. Defaults to the
 * "selected" winner, falling back to the first sample.
 */
export function useService(samples: SampleSummary[]) {
  const [selected, setSelected] = useState<string | null>(
    samples.find((s) => s.status === 'selected')?.id ?? samples[0]?.id ?? null
  );
  return { selected, setSelected };
}
