import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { MeasurementInput } from '@/api/types';
import { Banner, Button, ChoiceGroup, ErrorText, Field, Label, Screen } from '@/components/ui';
import { parseDecimal } from '@/features/babies/baby-form';
import { useI18n } from '@/i18n';
import { parseBirthDate } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { spacing } from '@/theme';

type Source = MeasurementInput['source'];

/** New measurements, pre-filled with the latest values (FR-MEAS-03). */
export default function Measure() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const today = new Date();
  const [day, setDay] = useState(String(today.getDate()));
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [source, setSource] = useState<Source>('CLINIC');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [hc, setHc] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState({ weight: '', length: '', hc: '' });

  useEffect(() => {
    api.growth(id).then((g) => {
      const v = { weight: g.latest.weight ? String(g.latest.weight.value) : '', length: g.latest.length ? String(g.latest.length.value) : '', hc: g.latest.headCircumference ? String(g.latest.headCircumference.value) : '' };
      setInitial(v);
      setWeight(v.weight);
      setLength(v.length);
      setHc(v.hc);
    }, () => undefined);
  }, [api, id]);

  async function save() {
    const date = parseBirthDate(day, month, year);
    if (!date) return setError(t('baby.invalidDate'));
    // Only send what was measured again (unchanged pre-filled values are not new measurements).
    // A date picked as "today" is noon local time, which can still be ahead of now.
    const measuredAt = date.getTime() > Date.now() ? new Date() : date;
    const body: MeasurementInput = { measuredAt: measuredAt.toISOString(), source, notes: notes.trim() || undefined };
    if (weight !== initial.weight && parseDecimal(weight) != null) body.weightGrams = Math.round(parseDecimal(weight)!);
    if (length !== initial.length && parseDecimal(length) != null) body.lengthCm = parseDecimal(length)!;
    if (hc !== initial.hc && parseDecimal(hc) != null) body.headCircumferenceCm = parseDecimal(hc)!;
    if (body.weightGrams == null && body.lengthCm == null && body.headCircumferenceCm == null) return setError(t('growth.atLeastOne'));
    setLoading(true);
    try {
      await api.addMeasurement(id, body);
      router.back();
    } catch (e) {
      setError(errorMessage(e, t));
      setLoading(false);
    }
  }

  const digits = (set: (v: string) => void, max: number) => (v: string) => set(v.replace(/\D/g, '').slice(0, max));
  const decimal = (set: (v: string) => void) => (v: string) => set(v.replace(/[^\d.,]/g, '').slice(0, 5));

  return (
    <Screen footer={<Button title={t('common.save')} onPress={save} loading={loading} icon="checkmark-circle" />}>
      <Banner tone="info">{t('growth.prefilled')}</Banner>
      <View style={{ gap: spacing.xs }}>
        <Label>{t('growth.measuredAt')}</Label>
        <View style={styles.dateRow}>
          <Field value={day} onChangeText={digits(setDay, 2)} keyboardType="number-pad" style={styles.dateSmall} accessibilityLabel={t('baby.day')} />
          <Field value={month} onChangeText={digits(setMonth, 2)} keyboardType="number-pad" style={styles.dateSmall} accessibilityLabel={t('baby.month')} />
          <Field value={year} onChangeText={digits(setYear, 4)} keyboardType="number-pad" style={styles.dateYear} accessibilityLabel={t('baby.year')} />
        </View>
      </View>
      <ChoiceGroup<Source>
        label={t('growth.where')}
        icon="business-outline"
        value={source}
        onChange={setSource}
        options={(['HOSPITAL', 'CLINIC', 'HOME'] as const).map((s) => ({ value: s, label: t(`growth.source.${s}`) }))}
      />
      <Field label={`${t('growth.weight')} (g)`} value={weight} onChangeText={digits(setWeight, 5)} keyboardType="number-pad" />
      <Field label={`${t('growth.length')} (cm)`} value={length} onChangeText={decimal(setLength)} keyboardType="decimal-pad" />
      <Field label={`${t('growth.headCircumference')} (cm)`} value={hc} onChangeText={decimal(setHc)} keyboardType="decimal-pad" />
      <Field label={t('clinic.notes')} value={notes} onChangeText={setNotes} maxLength={500} multiline />
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateSmall: { width: 76, textAlign: 'center' },
  dateYear: { width: 110, textAlign: 'center' },
});
