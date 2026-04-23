import type { FilterCheck } from './types';

export function pickOutput(check: FilterCheck): string {
  return check.out ?? check.output ?? '';
}
