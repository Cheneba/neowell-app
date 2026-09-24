import { babyAge, parseBirthDate } from '@/lib/dates';
import { formatPhone, toE164 } from '@/lib/phone';
import { parseTemperature } from '@/lib/temperature';

describe('toE164', () => {
  it.each([
    ['6 70 00 00 00', '+237670000000'],
    ['670000000', '+237670000000'],
    ['237670000000', '+237670000000'],
    ['+237 670 00 00 00', '+237670000000'],
    ['00237670000000', '+237670000000'],
    ['+33612345678', '+33612345678'],
  ])('%s → %s', (input, out) => expect(toE164(input)).toBe(out));

  it.each(['', 'abc', '67000', '6700000000000', '+23767000000'])('rejects %p', (input) =>
    expect(toE164(input)).toBeNull(),
  );

  it('formats Cameroon numbers for display', () => {
    expect(formatPhone('+237670000000')).toBe('+237 6 70 00 00 00');
  });
});

describe('parseBirthDate', () => {
  const now = new Date(2026, 8, 24, 15);
  it('accepts a valid past date', () => {
    const d = parseBirthDate('20', '09', '2026', now)!;
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 8, 20]);
  });
  it('rejects impossible and future dates', () => {
    expect(parseBirthDate('31', '02', '2026', now)).toBeNull();
    expect(parseBirthDate('1', '13', '2026', now)).toBeNull();
    expect(parseBirthDate('30', '09', '2026', now)).toBeNull();
    expect(parseBirthDate('', '', '', now)).toBeNull();
  });
});

describe('babyAge', () => {
  const now = new Date('2026-09-24T12:00:00Z');
  it('uses days, then weeks, then months', () => {
    expect(babyAge('2026-09-21T12:00:00Z', now)).toEqual({ unit: 'days', value: 3 });
    expect(babyAge('2026-08-24T12:00:00Z', now)).toEqual({ unit: 'weeks', value: 4 });
    expect(babyAge('2026-03-24T12:00:00Z', now)).toEqual({ unit: 'months', value: 6 });
  });
});

describe('parseTemperature', () => {
  it('accepts dot or comma decimals', () => {
    expect(parseTemperature('36.8')).toBe(36.8);
    expect(parseTemperature('37,5')).toBe(37.5);
  });
  it('rejects implausible values', () => {
    expect(parseTemperature('')).toBeNull();
    expect(parseTemperature('55')).toBeNull();
    expect(parseTemperature('abc')).toBeNull();
  });
});
