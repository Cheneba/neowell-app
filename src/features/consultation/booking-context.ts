/**
 * Carries the check that led to "Talk to a doctor" into the booking screen, so the booking is linked
 * to that check (observationId) and shows the fever checklist when relevant (FR-CONS-03/04).
 */
export type BookingContext = { babyId: string; observationId?: string; fever: boolean };
let ctx: BookingContext | null = null;

export const bookingContext = {
  set: (value: BookingContext | null) => {
    ctx = value;
  },
  get: () => ctx,
};

const FEVER_FINDINGS = ['FEVER', 'FEVER_VERY_HIGH', 'FEVER_YOUNG_INFANT', 'FEVER_HIGH', 'FEVER_PERSISTENT', 'FEVER_MODERATE', 'TEMPERATURE_RAISED'];

export function hasFever(findings: { code: string }[]) {
  return findings.some((f) => FEVER_FINDINGS.includes(f.code));
}
