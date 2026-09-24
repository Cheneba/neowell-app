import { en } from '@/i18n/en';
import { fr } from '@/i18n/fr';
import { translate } from '@/i18n';

/** Every code the backend risk engine (v0.1.0) can return. Keep in sync with neowell-backend. */
const FINDING_CODES = [
  'FEVER', 'TEMPERATURE_RAISED', 'HYPOTHERMIA_SEVERE', 'HYPOTHERMIA_MILD', 'CONVULSIONS',
  'UNABLE_TO_FEED', 'LETHARGIC', 'DIFFICULT_BREATHING', 'FAST_BREATHING', 'CYANOSIS',
  'CORD_INFECTION_SEVERE', 'BLOODY_STOOL', 'HIGH_PITCHED_CRY', 'JAUNDICE_SEVERE', 'JAUNDICE_EARLY',
  'JAUNDICE', 'FEEDING_REDUCED', 'FEEDING_INFREQUENT', 'ACTIVITY_REDUCED', 'WEAK_CRY',
  'INCONSOLABLE_CRY', 'PALLOR', 'MOTTLED_SKIN', 'CORD_INFECTION_LOCAL', 'DIARRHEA', 'NO_STOOL',
  'STOOL_REDUCED', 'MULTIPLE_CONCERNS', 'HIGH_RISK_BABY_WITH_CONCERN',
];
const ACTION_CODES = [
  'SEEK_CARE_NOW', 'SHOW_EMERGENCY_NUMBERS', 'SHOW_NEAREST_FACILITIES', 'WARM_SKIN_TO_SKIN_ON_THE_WAY',
  'REMOVE_EXTRA_CLOTHING', 'KEEP_BREASTFEEDING_IF_ABLE', 'WARM_SKIN_TO_SKIN', 'FEED_MORE_OFTEN',
  'KEEP_CORD_CLEAN_AND_DRY', 'CHECK_JAUNDICE_IN_DAYLIGHT', 'RECHECK_IN_HOURS', 'CONSIDER_TELECONSULT',
  'CONTINUE_ROUTINE_CARE',
];

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`),
  );
}

describe('translations', () => {
  it('French has exactly the same keys as English', () => {
    expect(keys(fr).sort()).toEqual(keys(en).sort());
  });

  it('has no empty strings', () => {
    for (const dict of [en, fr]) {
      for (const k of keys(dict)) expect(translate(dict === en ? 'en' : 'fr', k).trim()).not.toBe('');
    }
  });

  it.each(['en', 'fr'] as const)('covers every backend finding and action code (%s)', (locale) => {
    for (const code of FINDING_CODES) expect(translate(locale, `findings.${code}`)).not.toBe(`findings.${code}`);
    for (const code of ACTION_CODES) expect(translate(locale, `actions.${code}`)).not.toBe(`actions.${code}`);
  });

  it('keeps the same {placeholders} in both languages', () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const k of keys(en)) expect(ph(translate('fr', k))).toEqual(ph(translate('en', k)));
  });

  it('interpolates parameters', () => {
  });

  it('picks plural forms per language', () => {
    expect(translate('en', 'home.checksDue', { n: 1 })).toBe('1 check due today');
    expect(translate('en', 'home.checksDue', { n: 2 })).toBe('2 checks due today');
    expect(translate('en', 'home.ageDays', { n: 0 })).toBe('0 days old');
    expect(translate('fr', 'home.ageDays', { n: 0 })).toBe('0 jour');
    expect(translate('fr', 'home.checksDue', { n: 3 })).toBe('3 contrôles à faire aujourd’hui');
    expect(translate('fr', 'common.km', { n: 1.5 })).toBe('1.5 km');
  });

  it('falls back to the key for unknown codes', () => {
    expect(translate('fr', 'findings.SOMETHING_NEW')).toBe('findings.SOMETHING_NEW');
  });
});
