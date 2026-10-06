import type { Baby, CareStatus, NewBaby, Sex } from '@/api/types';
import { parseBirthDate } from '@/lib/dates';

/** Raw text values of the add/edit baby form. */
export interface BabyFormValues {
  sex?: Sex;
  day: string;
  month: string;
  year: string;
  givenName: string;
  weeks: string;
  weight: string;
  length: string;
  hc: string;
  facilityId?: string;
  facilityName: string;
  careStatus: CareStatus;
}

export const RANGES = {
  weeks: [22, 44],
  weight: [300, 7000],
  length: [25, 65],
  hc: [18, 45],
} as const;

export function emptyBabyForm(now = new Date()): BabyFormValues {
  return { day: '', month: '', year: String(now.getFullYear()), givenName: '', weeks: '', weight: '', length: '', hc: '', facilityName: '', careStatus: 'AT_HOME' };
}

export function babyToForm(b: Baby): BabyFormValues {
  const dob = new Date(b.dateOfBirth);
  const s = (v: number | null) => (v == null ? '' : String(v));
  return {
    sex: b.sex ?? undefined,
    day: String(dob.getDate()),
    month: String(dob.getMonth() + 1),
    year: String(dob.getFullYear()),
    givenName: b.givenName ?? '',
    weeks: s(b.gestationalAgeWeeks),
    weight: s(b.birthWeightGrams),
    length: s(b.birthLengthCm),
    hc: s(b.birthHeadCircumferenceCm),
    facilityId: b.birthFacility?.id,
    facilityName: b.birthFacility?.name ?? b.birthFacilityName ?? '',
    careStatus: b.careStatus,
  };
}

/** "49,5" or "49.5" → 49.5; null when empty or not a number. */
export function parseDecimal(text: string): number | null {
  if (!text.trim()) return null;
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

export type FormError = { key: 'required' | 'invalidDate' | 'outOfRange'; field?: keyof typeof RANGES };

/** Validates one step (or all steps) of the form; returns the first problem. */
export function validateBabyForm(v: BabyFormValues, step: 'about' | 'birth' | 'all', now = new Date()): FormError | null {
  if (step !== 'birth') {
    if (!v.sex) return { key: 'required' };
    if (!parseBirthDate(v.day, v.month, v.year, now)) return { key: 'invalidDate' };
  }
  if (step !== 'about') {
    for (const field of Object.keys(RANGES) as (keyof typeof RANGES)[]) {
      const n = parseDecimal(v[field]);
      if (n == null) return { key: 'required' };
      const [min, max] = RANGES[field];
      if (n < min || n > max) return { key: 'outOfRange', field };
    }
  }
  return null;
}

/** Converts a valid form into the API body. */
export function formToBaby(v: BabyFormValues): NewBaby {
  const picked = parseBirthDate(v.day, v.month, v.year)!;
  // A baby born today is entered as noon local time, which can still be ahead of now.
  const dob = picked.getTime() > Date.now() ? new Date() : picked;
  return {
    sex: v.sex!,
    dateOfBirth: dob.toISOString(),
    gestationalAgeWeeks: Math.round(parseDecimal(v.weeks)!),
    birthWeightGrams: Math.round(parseDecimal(v.weight)!),
    birthLengthCm: parseDecimal(v.length)!,
    birthHeadCircumferenceCm: parseDecimal(v.hc)!,
    givenName: v.givenName.trim() || undefined,
    birthFacilityId: v.facilityId,
    birthFacilityName: v.facilityId ? undefined : v.facilityName.trim() || undefined,
    careStatus: v.careStatus,
  };
}

/** User-facing text for a form error. */
export function formErrorText(
  e: FormError, t: (k: string, p?: Record<string, string | number>) => string) {
  if (e.key === 'outOfRange' && e.field) {
    const label = { weeks: 'baby.gestationalAge', weight: 'baby.birthWeight', length: 'baby.birthLength', hc: 'baby.hc' }[e.field];
    return t('baby.outOfRange', { field: t(label) });
  }
  return t(`baby.${e.key}`);
}
