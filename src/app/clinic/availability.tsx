import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, CheckRow, ErrorText, Field, Screen } from '@/components/ui';
import { rowsToSlots, slotsToRows } from '@/features/clinician/availability';
import { useClinician } from '@/features/clinician/clinician-context';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { spacing } from '@/theme';

/** Weekly availability, Monday first (FR-CLIN-04). */
export default function Availability() {
  const { t, list } = useI18n();
  const { api } = useSession();
  const { profile, reload } = useClinician();
  const [rows, setRows] = useState(() => slotsToRows(profile?.availability ?? []));
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const days = list('days');
  const set = (day: number, patch: Partial<(typeof rows)[number]>) => setRows((rs) => rs.map((r, i) => (i === day ? { ...r, ...patch } : r)));

  async function save() {
    const slots = rowsToSlots(rows);
    if (!slots) return setError(t('clinic.invalidHours'));
    setLoading(true);
    try {
      await api.setAvailability(slots);
      await reload();
      router.back();
    } catch (e) {
      setError(errorMessage(e, t));
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button title={t('clinic.saveAvailability')} icon="checkmark-circle" loading={loading} onPress={save} />}>
      {[1, 2, 3, 4, 5, 6, 0].map((day) => (
        <View key={day} style={{ gap: spacing.xs }}>
          <CheckRow checked={rows[day].on} onToggle={() => set(day, { on: !rows[day].on })} label={days[day]} />
          {rows[day].on ? (
            <View style={styles.times}>
              <View style={{ flex: 1 }}>
                <Field label={t('clinic.from')} value={rows[day].from} onChangeText={(from) => set(day, { from })} keyboardType="numbers-and-punctuation" maxLength={5} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label={t('clinic.to')} value={rows[day].to} onChangeText={(to) => set(day, { to })} keyboardType="numbers-and-punctuation" maxLength={5} />
              </View>
            </View>
          ) : null}
        </View>
      ))}
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  times: { flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.lg },
});
