import type { CheckResult } from '@/api/types';

/**
 * Hands the result from the check screen to the result screen without
 * squeezing it into URL params.
 */
export type LastResult = CheckResult & { babyId: string; babyName: string; ageDays: number; queued?: boolean };
let last: LastResult | null = null;

export const lastResult = {
  set: (value: LastResult) => {
    last = value;
  },
  get: () => last,
};
