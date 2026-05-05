import type { StageDataMap, StageKey } from '../../types';

/** Output payload of the latest attempt for a given stage, or null. */
export function latestOutput(stageData: StageDataMap, key: StageKey): unknown {
  return stageData[key].attempts.at(-1)?.output ?? null;
}
