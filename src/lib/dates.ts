/** Builds a date from separate day/month/year fields; null if invalid or in the future. */
export function parseBirthDate(day: string, month: string, year: string, now = new Date()): Date | null {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return null;
  if (y < 1900 || m < 1 || m > 12 || d < 1) return null;
  // Noon local time avoids the date shifting across time zones.
  const date = new Date(y, m - 1, d, 12);
  if (date.getMonth() !== m - 1 || date.getDate() !== d) return null; // e.g. 31/02
  if (date.getTime() > now.getTime() + 12 * 60 * 60 * 1000) return null;
  return date;
}

export type Age = { unit: 'days' | 'weeks' | 'months'; value: number };

/** Friendly age for a baby: days for the first 2 weeks, then weeks until ~3 months, then months. */
export function babyAge(dateOfBirth: string | Date, now = new Date()): Age {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(dateOfBirth).getTime()) / 86_400_000));
  if (days < 14) return { unit: 'days', value: days };
  if (days < 91) return { unit: 'weeks', value: Math.floor(days / 7) };
  return { unit: 'months', value: Math.floor(days / 30.44) };
}
