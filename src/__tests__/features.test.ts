import { NetworkError } from '@/api/client';
import type { Message, PlanQuestion } from '@/api/types';
import { tipFor } from '@/content/tips';
import { emptyBabyForm, formToBaby, parseDecimal, validateBabyForm } from '@/features/babies/baby-form';
import { offlineQueue } from '@/features/checks/offline-queue';
import { initialAnswers, isVisible, offlineDanger, toObservation } from '@/features/checks/plan';
import { parseClock, rowsToSlots, slotsToRows } from '@/features/clinician/availability';
import { hasFever } from '@/features/consultation/booking-context';
import { mergeMessages } from '@/features/consultation/messages';
import { lowestFee, refundOnCancel } from '@/features/consultation/status';
import { doseInstant, upcomingDoses } from '@/features/notifications/notifications';
import { babyName } from '@/lib/format';

jest.mock('@/lib/storage', () => {
  const mem = new Map<string, string>();
  return {
    storage: {
      get: async (k: string) => mem.get(k) ?? null,
      set: async (k: string, v: string) => void mem.set(k, v),
      remove: async (k: string) => void mem.delete(k),
    },
  };
});

const q = (over: Partial<PlanQuestion>): PlanQuestion => ({ id: 'q', field: 'f', kind: 'SINGLE', required: true, label: 'L', ...over });
const temp = q({ id: 'temp', field: 'temperatureC', kind: 'TEMPERATURE', defaultValue: 36.8 });
const room = q({ id: 'room', field: 'roomFeel', showIf: { field: 'temperatureC', notBetween: [36.5, 37.5] }, options: [{ value: 'HOT', label: 'Hot', danger: false }] });
const fits = q({ id: 'fits', field: 'convulsions', kind: 'BOOLEAN', options: [{ value: 'true', label: 'Yes', danger: true }, { value: 'false', label: 'No', danger: false }] });

describe('check plan', () => {
  it('shows context questions only when the temperature is off', () => {
    expect(isVisible(room, { temperatureC: 36.8 })).toBe(false);
    expect(isVisible(room, { temperatureC: 38.2 })).toBe(true);
    expect(isVisible(room, { temperatureC: '36,1' })).toBe(true);
    expect(isVisible(room, {})).toBe(false);
  });

  it('pre-fills default values', () => {
    expect(initialAnswers([temp, room])).toEqual({ temperatureC: 36.8 });
  });

  it('builds the API body: drops hidden answers, parses temperature and booleans', () => {
    expect(toObservation([temp, room, fits], { temperatureC: '38,4', roomFeel: 'HOT', convulsions: 'false' })).toEqual({
      temperatureC: 38.4,
      roomFeel: 'HOT',
      convulsions: false,
    });
    expect(toObservation([temp, room], { temperatureC: 36.9, roomFeel: 'HOT' })).toEqual({ temperatureC: 36.9 });
    expect(toObservation([temp], { temperatureC: '50' })).toBeNull();
  });

  it('flags danger offline from options or temperature', () => {
    expect(offlineDanger([temp, fits], { temperatureC: 36.8, convulsions: true })).toBe(true);
    expect(offlineDanger([temp, fits], { temperatureC: 38.1 })).toBe(true);
    expect(offlineDanger([temp, fits], { temperatureC: 36.8, convulsions: false })).toBe(false);
  });
});

describe('offline queue', () => {
  it('sends queued checks and keeps the rest on network failure', async () => {
    await offlineQueue.add({ babyId: 'b', input: { temperatureC: 37, clientRef: 'a' }, queuedAt: '' });
    await offlineQueue.add({ babyId: 'b', input: { temperatureC: 37, clientRef: 'b' }, queuedAt: '' });
    const sent: string[] = [];
    const api = {
      createObservation: jest.fn(async (_id: string, input: { clientRef?: string }) => {
        if (input.clientRef === 'b') throw new NetworkError('offline');
        sent.push(input.clientRef!);
        return {} as never;
      }),
    };
    expect(await offlineQueue.flush(api)).toBe(1);
    expect(sent).toEqual(['a']);
    expect((await offlineQueue.list()).map((x) => x.input.clientRef)).toEqual(['b']);
  });
});

describe('naming', () => {
  it('shows "Bébé" in French', () => {
    expect(babyName('Baby Ngono', 'fr')).toBe('Bébé Ngono');
    expect(babyName('Baby Ngono 2', 'en')).toBe('Baby Ngono 2');
    expect(babyName('Amina', 'fr')).toBe('Amina');
  });
});

describe('baby form', () => {
  const now = new Date(2026, 9, 6, 12);
  const filled = { ...emptyBabyForm(now), sex: 'FEMALE' as const, day: '1', month: '10', year: '2026', weeks: '35', weight: '2100', length: '45,5', hc: '32' };

  it('validates per step', () => {
    expect(validateBabyForm(emptyBabyForm(now), 'about', now)).toEqual({ key: 'required' });
    expect(validateBabyForm({ ...filled, day: '30', month: '10' }, 'about', now)).toEqual({ key: 'invalidDate' });
    expect(validateBabyForm(filled, 'all', now)).toBeNull();
    expect(validateBabyForm({ ...filled, hc: '60' }, 'birth', now)).toEqual({ key: 'outOfRange', field: 'hc' });
  });

  it('converts to the API body', () => {
    const body = formToBaby({ ...filled, facilityName: 'Hôpital Laquintinie' });
    expect(body).toMatchObject({ sex: 'FEMALE', gestationalAgeWeeks: 35, birthWeightGrams: 2100, birthLengthCm: 45.5, birthHeadCircumferenceCm: 32, birthFacilityName: 'Hôpital Laquintinie' });
    expect(body.givenName).toBeUndefined();
    expect(parseDecimal('')).toBeNull();
    const today = new Date();
    const born = formToBaby({ ...filled, day: String(today.getDate()), month: String(today.getMonth() + 1), year: String(today.getFullYear()) });
    expect(new Date(born.dateOfBirth).getTime()).toBeLessThanOrEqual(Date.now());
  });
});

describe('medicines', () => {
  it('lists upcoming doses within the chart duration', () => {
    const now = new Date(2026, 9, 6, 9, 0);
    const start = new Date(2026, 9, 6, 0, 0).toISOString();
    const doses = upcomingDoses({ startDate: start, items: [{ id: 'i', drugName: 'Paracetamol', dose: '2.5 ml', route: 'Oral', timesOfDay: ['08:00', '20:00'], durationDays: 2, instructions: null }] }, now);
    expect(doses.map((d) => [d.at.getDate(), d.at.getHours()])).toEqual([
      [6, 20],
      [7, 8],
      [7, 20],
    ]);
  });

  it('keys a dose by today at that time', () => {
    const d = new Date(doseInstant('08:30', new Date(2026, 9, 6, 15)));
    expect([d.getDate(), d.getHours(), d.getMinutes()]).toEqual([6, 8, 30]);
  });
});

describe('consultations', () => {
  it('mirrors the refund rule', () => {
    const now = new Date('2026-10-06T10:00:00Z');
    expect(refundOnCancel({ status: 'REQUESTED', scheduledAt: '2026-10-06T10:10:00Z', paymentStatus: 'PAID' }, now)).toBe(true);
    expect(refundOnCancel({ status: 'CONFIRMED', scheduledAt: '2026-10-06T10:30:00Z', paymentStatus: 'PAID' }, now)).toBe(false);
    expect(refundOnCancel({ status: 'CONFIRMED', scheduledAt: '2026-10-06T11:00:00Z', paymentStatus: 'PAID' }, now)).toBe(true);
    expect(refundOnCancel({ status: 'AWAITING_PAYMENT', scheduledAt: '2026-10-07T11:00:00Z', paymentStatus: 'UNPAID' }, now)).toBe(false);
  });

  it('finds the lowest fee and fever findings', () => {
    expect(lowestFee({ CHAT: 2000, VIDEO: 5000 })).toBe(2000);
    expect(lowestFee({})).toBeNull();
    expect(hasFever([{ code: 'FEVER_YOUNG_INFANT' }])).toBe(true);
    expect(hasFever([{ code: 'JAUNDICE' }])).toBe(false);
  });

  it('merges polled messages without duplicates, oldest first', () => {
    const m = (id: string, at: string) => ({ id, createdAt: at }) as Message;
    const merged = mergeMessages([m('a', '2026-10-06T10:00:00Z'), m('b', '2026-10-06T10:01:00Z')], [m('b', '2026-10-06T10:01:00Z'), m('c', '2026-10-06T10:00:30Z')]);
    expect(merged.map((x) => x.id)).toEqual(['a', 'c', 'b']);
  });
});

describe('availability', () => {
  it('parses clock times', () => {
    expect(parseClock('8:30')).toBe(510);
    expect(parseClock('08h00')).toBe(480);
    expect(parseClock('24:00')).toBe(1440);
    expect(parseClock('25:00')).toBeNull();
  });

  it('round-trips weekly slots and rejects bad ranges', () => {
    const rows = slotsToRows([{ dayOfWeek: 1, startMinute: 480, endMinute: 1020 }]);
    expect(rows[1]).toEqual({ on: true, from: '08:00', to: '17:00' });
    expect(rows[0].on).toBe(false);
    expect(rowsToSlots(rows)).toEqual([{ dayOfWeek: 1, startMinute: 480, endMinute: 1020 }]);
    rows[1].to = '07:00';
    expect(rowsToSlots(rows)).toBeNull();
  });
});

describe('tips', () => {
  it('picks a tip for the age band in the right language', () => {
    expect(tipFor(3, 'en', new Date(0))).toMatch(/Breastfeed|cord|warm|Yellow/);
    expect(tipFor(200, 'fr', new Date(0))).toMatch(/allaitement|moustiquaire|fièvre/i);
  });
});
