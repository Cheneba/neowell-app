import type { Answers, PlanQuestion } from '@/api/types';
import { parseTemperature } from '@/lib/temperature';

/** Evaluates a question's `showIf` against the answers so far (e.g. room/clothing when temp is off). */
export function isVisible(q: PlanQuestion, answers: Answers): boolean {
  if (!q.showIf) return true;
  const raw = answers[q.showIf.field];
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseTemperature(raw) : null;
  if (value == null) return false;
  if (q.showIf.notBetween) {
    const [from, to] = q.showIf.notBetween;
    return value < from || value >= to;
  }
  return true;
}

/** Initial answers: defaults for numeric questions (temperature, feeds). */
export function initialAnswers(questions: PlanQuestion[]): Answers {
  const a: Answers = {};
  for (const q of questions) if (q.defaultValue != null && q.kind !== 'BREATH_COUNTER') a[q.field] = q.defaultValue;
  return a;
}

/**
 * Converts answers to the API body: drops hidden questions and booleans sent as "true"/"false".
 * Returns null when the temperature is missing or invalid.
 */
export function toObservation(questions: PlanQuestion[], answers: Answers): Answers | null {
  const body: Answers = {};
  for (const q of questions) {
    if (!isVisible(q, answers)) continue;
    let v = answers[q.field];
    if (v === undefined || v === '') continue;
    if (q.kind === 'TEMPERATURE') {
      const t = typeof v === 'number' ? v : parseTemperature(String(v));
      if (t == null) return null;
      v = t;
    }
    if (q.kind === 'BOOLEAN') v = v === true || v === 'true';
    body[q.field] = v;
  }
  return typeof body.temperatureC === 'number' ? body : null;
}

/**
 * Used only when a check cannot be sent (offline): true when a danger option was chosen or the
 * temperature is clearly abnormal, so the app can still say "seek care now" (FR-CHK-11).
 */
export function offlineDanger(questions: PlanQuestion[], body: Answers): boolean {
  const temp = body.temperatureC;
  if (typeof temp === 'number' && (temp >= 38 || temp < 35.5)) return true;
  return questions.some((q) => q.options?.some((o) => o.danger && String(body[q.field]) === o.value));
}
