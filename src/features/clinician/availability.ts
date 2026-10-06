export type DayRow = { on: boolean; from: string; to: string };
type Slot = { dayOfWeek: number; startMinute: number; endMinute: number };

const toLabel = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** "8:30" / "08:30" / "8h30" → minutes after midnight, or null. */
export function parseClock(text: string): number | null {
  const m = /^(\d{1,2})[:hH.]?(\d{2})?$/.exec(text.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (h > 24 || min > 59 || (h === 24 && min > 0)) return null;
  return h * 60 + min;
}

/** One editable row per weekday (Sunday = 0), from the stored slots. */
export function slotsToRows(slots: Slot[]): DayRow[] {
  return Array.from({ length: 7 }, (_, day) => {
    const s = slots.find((x) => x.dayOfWeek === day);
    return s ? { on: true, from: toLabel(s.startMinute), to: toLabel(s.endMinute) } : { on: false, from: '08:00', to: '17:00' };
  });
}

/** Rows back to API slots; null when an enabled row has an invalid or empty range. */
export function rowsToSlots(rows: DayRow[]): Slot[] | null {
  const slots: Slot[] = [];
  for (const [day, r] of rows.entries()) {
    if (!r.on) continue;
    const start = parseClock(r.from);
    const end = parseClock(r.to);
    if (start == null || end == null || end <= start) return null;
    slots.push({ dayOfWeek: day, startMinute: start, endMinute: end });
  }
  return slots;
}
