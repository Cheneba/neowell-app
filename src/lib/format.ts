import { babyAge } from './dates';

export function ageLabel(dateOfBirth: string, t: (k: string, p?: Record<string, number>) => string) {
  const age = babyAge(dateOfBirth);
  const key = { days: 'home.ageDays', weeks: 'home.ageWeeks', months: 'home.ageMonths' }[age.unit];
  return t(key, { n: age.value });
}

export function timeLabel(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
