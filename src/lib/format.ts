import { babyAge } from './dates';

type T = (k: string, p?: Record<string, string | number>) => string;

export function ageLabel(dateOfBirth: string, t: T) {
  const age = babyAge(dateOfBirth);
  const key = { days: 'home.ageDays', weeks: 'home.ageWeeks', months: 'home.ageMonths' }[age.unit];
  return t(key, { n: age.value });
}

/** "12 days old · corrected age 2 days" for preterm babies. */
export function fullAgeLabel(b: { dateOfBirth: string; correctedAgeDays: number | null }, t: T) {
  const base = ageLabel(b.dateOfBirth, t);
  if (b.correctedAgeDays == null) return base;
  const corrected = new Date(Date.now() - Math.max(0, b.correctedAgeDays) * 86_400_000).toISOString();
  return `${base} · ${t('home.correctedAge', { age: ageLabel(corrected, t) })}`;
}

/** The API names babies "Baby {mother}" (hospital convention); French shows "Bébé {mother}". */
export function babyName(displayName: string, locale: string) {
  return locale === 'fr' ? displayName.replace(/^Baby\b/, 'Bébé') : displayName;
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

export function clockLabel(iso: string | Date, locale: string) {
  return new Date(iso).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function dateLabel(iso: string | Date, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function money(n: number) {
  return `${n.toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;
}

/** "HH:mm" for minutes after midnight. */
export function minutesLabel(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
