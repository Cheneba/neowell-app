import { StyleSheet, View } from 'react-native';
import type { CareStatus, Sex } from '@/api/types';
import { Banner, ChoiceGroup, Field, Label } from '@/components/ui';
import { FacilityPicker } from '@/features/babies/FacilityPicker';
import { useI18n } from '@/i18n';
import { spacing } from '@/theme';
import type { BabyFormValues } from './baby-form';

type Props = { values: BabyFormValues; set: (patch: Partial<BabyFormValues>) => void; lastName: string };

const digits = (max: number) => (v: string) => v.replace(/\D/g, '').slice(0, max);
const decimal = (v: string) => v.replace(/[^\d.,]/g, '').slice(0, 5);

export function AboutFields({ values: v, set, lastName }: Props) {
  const { t } = useI18n();
  return (
    <>
      <ChoiceGroup<Sex>
        label={t('baby.sex')}
        icon="happy-outline"
        value={v.sex}
        onChange={(sex) => set({ sex })}
        options={(['FEMALE', 'MALE'] as const).map((s) => ({ value: s, label: t(`baby.${s}`) }))}
      />
      <View style={{ gap: spacing.xs }}>
        <Label>{t('baby.dateOfBirth')}</Label>
        <View style={styles.dateRow}>
          <Field value={v.day} onChangeText={(x) => set({ day: digits(2)(x) })} placeholder={t('baby.day')} keyboardType="number-pad" style={styles.dateSmall} accessibilityLabel={t('baby.day')} />
          <Field value={v.month} onChangeText={(x) => set({ month: digits(2)(x) })} placeholder={t('baby.month')} keyboardType="number-pad" style={styles.dateSmall} accessibilityLabel={t('baby.month')} />
          <Field value={v.year} onChangeText={(x) => set({ year: digits(4)(x) })} placeholder={t('baby.year')} keyboardType="number-pad" style={styles.dateYear} accessibilityLabel={t('baby.year')} />
        </View>
      </View>
      <Field
        label={`${t('baby.givenName')} · ${t('common.optional')}`}
        value={v.givenName}
        onChangeText={(givenName) => set({ givenName })}
        autoCapitalize="words"
        maxLength={60}
        hint={t('baby.givenNameHint', { lastName })}
      />
    </>
  );
}

export function BirthFields({ values: v, set }: Props) {
  const { t } = useI18n();
  return (
    <>
      <Banner tone="info" icon="book-outline">{t('baby.bookletHint')}</Banner>
      <Field label={t('baby.gestationalAge')} hint={t('baby.gestationalAgeHint')} value={v.weeks} onChangeText={(x) => set({ weeks: digits(2)(x) })} keyboardType="number-pad" placeholder="39" />
      <Field label={t('baby.birthWeight')} value={v.weight} onChangeText={(x) => set({ weight: digits(4)(x) })} keyboardType="number-pad" placeholder="3200" />
      <Field label={t('baby.birthLength')} value={v.length} onChangeText={(x) => set({ length: decimal(x) })} keyboardType="decimal-pad" placeholder="49,5" />
      <Field label={t('baby.hc')} hint={t('baby.hcHint')} value={v.hc} onChangeText={(x) => set({ hc: decimal(x) })} keyboardType="decimal-pad" placeholder="34" />
    </>
  );
}

export function WhereFields({ values: v, set }: Props) {
  const { t } = useI18n();
  return (
    <>
      <FacilityPicker
        label={t('baby.birthFacility')}
        selectedId={v.facilityId}
        name={v.facilityName}
        onChange={(facilityId, facilityName) => set({ facilityId, facilityName })}
      />
      <ChoiceGroup<CareStatus>
        label={t('baby.careStatus')}
        icon="home-outline"
        value={v.careStatus}
        onChange={(careStatus) => set({ careStatus })}
        options={(['AT_HOME', 'IN_HOSPITAL', 'KANGAROO_CARE'] as const).map((s) => ({ value: s, label: t(`baby.${s}`) }))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateSmall: { width: 76, textAlign: 'center' },
  dateYear: { width: 110, textAlign: 'center' },
});
