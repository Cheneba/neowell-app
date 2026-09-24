import type { Assessment } from '@/api/types';

/**
 * Hands the assessment from the check screen to the result screen without
 * squeezing it into URL params.
 */
let last: { babyId: string; babyName: string; assessment: Assessment } | null = null;

export const lastResult = {
  set: (value: NonNullable<typeof last>) => {
    last = value;
  },
  get: () => last,
};
