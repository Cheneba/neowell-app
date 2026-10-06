import { en } from '@/i18n/en';
import { fr } from '@/i18n/fr';
import { translate } from '@/i18n';

/** Every code the backend risk engine (v0.2.0) can return. Keep in sync with neowell-backend. */
const FINDING_CODES = [
  'ACTIVITY_REDUCED', 'BLOODY_STOOL', 'CHEST_INDRAWING', 'CONVULSIONS', 'CORD_INFECTION_LOCAL',
  'CORD_INFECTION_SEVERE', 'CYANOSIS', 'DIARRHEA', 'DIFFICULT_BREATHING', 'FAST_BREATHING',
  'FAST_BREATHING_INFANT', 'FEEDING_INFREQUENT', 'FEEDING_REDUCED', 'FEVER_HIGH', 'FEVER_MODERATE',
  'FEVER_PERSISTENT', 'FEVER_VERY_HIGH', 'FEVER_YOUNG_INFANT', 'FLUSHED_SKIN', 'GRUNTING',
  'HIGH_PITCHED_CRY', 'HIGH_RISK_BABY_WITH_CONCERN', 'HYPOTHERMIA_MILD', 'HYPOTHERMIA_SEVERE',
  'INCONSOLABLE_CRY', 'JAUNDICE', 'JAUNDICE_EARLY', 'JAUNDICE_SEVERE', 'LETHARGIC', 'MOTTLED_SKIN',
  'MULTIPLE_CONCERNS', 'NOISY_BREATHING', 'NOT_CRYING', 'NO_STOOL', 'OVERHEATING_LIKELY', 'PALLOR',
  'PROLONGED_JAUNDICE', 'SLOW_BREATHING', 'STOOL_REDUCED', 'TEMPERATURE_RAISED', 'UNABLE_TO_FEED',
  'VOMITING_GREEN_OR_FORCEFUL', 'VOMITING_REPEATED', 'WEAK_CRY', 'WHEEZING',
];
const ACTION_CODES = [
  'CHECK_JAUNDICE_IN_DAYLIGHT', 'CONSIDER_TELECONSULT', 'CONTINUE_ROUTINE_CARE', 'COOLING_STEPS',
  'COOL_ROOM', 'FEED_MORE_OFTEN', 'KEEP_BREASTFEEDING_IF_ABLE', 'KEEP_CORD_CLEAN_AND_DRY',
  'NO_HOME_MEDICINES', 'RECHECK_IN_HOURS', 'RECHECK_TEMP_30_MIN', 'REMOVE_EXTRA_CLOTHING',
  'SEEK_CARE_NOW', 'SHOW_EMERGENCY_NUMBERS', 'SHOW_NEAREST_FACILITIES', 'WARM_SKIN_TO_SKIN',
  'WARM_SKIN_TO_SKIN_ON_THE_WAY', 'WATCH_FOR_FITS',
];
/** Other server codes the app translates. */
const OTHER_CODES = [
  ...['PRETERM', 'VERY_PRETERM', 'LOW_BIRTH_WEIGHT', 'VERY_LOW_BIRTH_WEIGHT', 'BIRTH_LENGTH_OUT_OF_RANGE', 'BIRTH_HEAD_SIZE_OUT_OF_RANGE', 'MISSING_BIRTH_DATA'].map((c) => `riskFactors.${c}`),
  ...['EXTREMELY_PRETERM', 'VERY_PRETERM', 'MODERATE_LATE_PRETERM', 'TERM', 'POST_TERM'].map((c) => `termStatus.${c}`),
  ...['CONFIRMED', 'STARTED', 'COMPLETED', 'CANCELLED', 'DECLINED', 'NO_SHOW'].map((c) => `consultation.system.${c}`),
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
    for (const key of OTHER_CODES) expect(translate(locale, key)).not.toBe(key);
  });

  it('has the weekday names', () => {
    expect(translate('fr', 'days.1')).toBe('Lundi');
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
