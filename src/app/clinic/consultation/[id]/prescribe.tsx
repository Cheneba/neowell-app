import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, ErrorText, Field, Label, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { colors, fonts, radius, spacing } from '@/theme';

const TIMES = ['06:00', '08:00', '12:00', '14:00', '18:00', '20:00', '22:00'];
type Item = { drugName: string; dose: string; route: string; timesOfDay: string[]; durationDays: string; instructions: string };
const emptyItem = (): Item => ({ drugName: '', dose: '', route: 'Oral', timesOfDay: ['08:00', '20:00'], durationDays: '5', instructions: '' });

/** Drug chart: one row per medicine (FR-CONS-12). */
export default function Prescribe() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const set = (i: number, patch: Partial<Item>) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  async function save() {
    const valid = items.every((x) => x.drugName.trim() && x.dose.trim() && x.route.trim() && x.timesOfDay.length && Number(x.durationDays) >= 1);
    if (!valid) return setError(t('baby.required'));
    setLoading(true);
    try {
      await api.prescribe(
        id,
        items.map((x) => ({
          drugName: x.drugName.trim(),
          dose: x.dose.trim(),
          route: x.route.trim(),
          timesOfDay: [...x.timesOfDay].sort(),
          durationDays: Number(x.durationDays),
          instructions: x.instructions.trim() || undefined,
        })),
      );
      router.back();
    } catch (e) {
      setError(errorMessage(e, t));
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button title={t('clinic.saveChart')} icon="checkmark-circle" loading={loading} onPress={save} />}>
      {items.map((x, i) => (
        <Card key={i}>
          <Field label={t('clinic.drug')} value={x.drugName} onChangeText={(drugName) => set(i, { drugName })} maxLength={120} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label={t('clinic.dose')} value={x.dose} onChangeText={(dose) => set(i, { dose })} maxLength={60} placeholder="2.5 ml" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t('clinic.route')} value={x.route} onChangeText={(route) => set(i, { route })} maxLength={60} />
            </View>
          </View>
          <Label>{t('clinic.times')}</Label>
          <View style={styles.chips}>
            {TIMES.map((time) => {
              const on = x.timesOfDay.includes(time);
              return (
                <Pressable
                  key={time}
                  onPress={() => set(i, { timesOfDay: on ? x.timesOfDay.filter((y) => y !== time) : [...x.timesOfDay, time] })}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && { color: colors.white }]}>{time}</Text>
                </Pressable>
              );
            })}
          </View>
          <Field label={t('clinic.days')} value={x.durationDays} onChangeText={(v) => set(i, { durationDays: v.replace(/\D/g, '').slice(0, 2) })} keyboardType="number-pad" />
          <Field label={t('clinic.instructions')} value={x.instructions} onChangeText={(instructions) => set(i, { instructions })} maxLength={500} multiline />
          {items.length > 1 ? <Button title={t('common.remove')} variant="ghost" icon="trash-outline" onPress={() => setItems((xs) => xs.filter((_, j) => j !== i))} /> : null}
        </Card>
      ))}
      <Button title={t('clinic.addItem')} variant="outline" icon="add-circle" onPress={() => setItems((xs) => [...xs, emptyItem()])} />
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { minHeight: 40, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.blueDeep, borderColor: colors.blueDeep },
  chipText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
});
