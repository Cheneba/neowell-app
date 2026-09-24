import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Sex } from '@/api/types';
import { Button, ChoiceGroup, ErrorText, Field, Label, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { parseBirthDate } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { spacing } from '@/theme';

export default function NewBaby() {
  const { t } = useI18n();
  const { api } = useSession();
  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex>();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [weight, setWeight] = useState('');
  const [weeks, setWeeks] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!name.trim()) return setError(t('baby.nameRequired'));
    const dob = parseBirthDate(day, month, year);
    if (!dob) return setError(t('baby.invalidDate'));
    setError(undefined);
    setLoading(true);
    try {
      const baby = await api.createBaby({
        name: name.trim(),
        dateOfBirth: dob.toISOString(),
        sex,
        birthWeightGrams: weight ? Number(weight) : undefined,
        gestationalAgeWeeks: weeks ? Number(weeks) : undefined,
      });
      router.replace({ pathname: '/baby/[id]', params: { id: baby.id } });
    } catch (e) {
      setError(errorMessage(e, t));
      setLoading(false);
    }
  }

  const digits = (set: (v: string) => void, max: number) => (v: string) => set(v.replace(/\D/g, '').slice(0, max));

  return (
    <Screen footer={<Button title={t('common.save')} onPress={save} loading={loading} icon="checkmark-circle" />}>
      <Field label={t('baby.name')} value={name} onChangeText={setName} autoCapitalize="words" maxLength={120} />
      <ChoiceGroup<Sex>
        label={t('baby.sex')}
        icon="happy-outline"
        value={sex}
        onChange={setSex}
        options={(['FEMALE', 'MALE', 'UNKNOWN'] as const).map((v) => ({ value: v, label: t(`baby.${v}`) }))}
      />
      <View style={{ gap: spacing.xs }}>
        <Label>{t('baby.dateOfBirth')}</Label>
        <View style={styles.dateRow}>
          <Field value={day} onChangeText={digits(setDay, 2)} placeholder={t('baby.day')} keyboardType="number-pad" style={styles.dateSmall} accessibilityLabel={t('baby.day')} />
          <Field value={month} onChangeText={digits(setMonth, 2)} placeholder={t('baby.month')} keyboardType="number-pad" style={styles.dateSmall} accessibilityLabel={t('baby.month')} />
          <Field value={year} onChangeText={digits(setYear, 4)} placeholder={t('baby.year')} keyboardType="number-pad" style={styles.dateYear} accessibilityLabel={t('baby.year')} />
        </View>
      </View>
      <Field
        label={`${t('baby.birthWeight')} · ${t('baby.optional')}`}
        value={weight}
        onChangeText={digits(setWeight, 4)}
        keyboardType="number-pad"
        placeholder="3200"
      />
      <Field
        label={`${t('baby.gestationalAge')} · ${t('baby.optional')}`}
        value={weeks}
        onChangeText={digits(setWeeks, 2)}
        keyboardType="number-pad"
        placeholder="39"
      />
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateSmall: { width: 76, textAlign: 'center' },
  dateYear: { width: 110, textAlign: 'center' },
});
