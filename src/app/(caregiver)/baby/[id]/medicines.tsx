import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DrugChart, DrugChartItem } from '@/api/types';
import { doseInstant } from '@/features/notifications/notifications';
import { Banner, Body, Button, Card, EmptyState, ErrorText, Loading, Pill, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { dateLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

export default function Medicines() {
  const { t, locale } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const { data, error, loading, reload } = useFocusData(() => api.drugCharts(id));

  if (loading && !data) return <Loading />;
  if (!data) return <Screen><ErrorText>{errorMessage(error, t)}</ErrorText></Screen>;

  const active = data.filter((c) => c.active !== false);
  const past = data.filter((c) => c.active === false);
  return (
    <Screen>
      {active.length ? <Banner tone="info" icon="alarm-outline">{t('medicines.remindersOn')}</Banner> : <EmptyState icon="medical">{t('medicines.none')}</EmptyState>}
      {active.map((c) => (
        <ChartCard key={c.id} chart={c} onChange={reload} />
      ))}
      {past.length ? <Text style={styles.h2}>{t('medicines.past')}</Text> : null}
      {past.map((c) => (
        <Card key={c.id} style={{ opacity: 0.7 }}>
          {c.items.map((i) => (
            <Body key={i.id} style={{ fontSize: 15 }}>• {i.drugName} — {i.dose}</Body>
          ))}
          <Body muted style={{ fontSize: 13 }}>{dateLabel(c.startDate, locale)}</Body>
        </Card>
      ))}
    </Screen>
  );
}

function ChartCard({ chart, onChange }: { chart: DrugChart; onChange: () => void }) {
  const { t, locale } = useI18n();
  return (
    <Card>
      {chart.prescriber ? <Body muted style={{ fontSize: 14 }}>{t('medicines.by', { name: chart.prescriber })}</Body> : null}
      {chart.endsAt ? <Body muted style={{ fontSize: 14 }}>{t('medicines.until', { date: dateLabel(chart.endsAt, locale) })}</Body> : null}
      {chart.items.map((i) => (
        <ItemRow key={i.id} item={i} onChange={onChange} />
      ))}
    </Card>
  );
}

function ItemRow({ item, onChange }: { item: DrugChartItem; onChange: () => void }) {
  const { t } = useI18n();
  const { api } = useSession();
  const [busy, setBusy] = useState<string>();
  const [err, setErr] = useState<string>();

  async function log(at: string, status: 'GIVEN' | 'SKIPPED') {
    setBusy(at);
    try {
      await api.logDose(item.id, at, status);
      onChange();
    } catch (e) {
      setErr(errorMessage(e, t));
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <View style={styles.item}>
      <Text style={styles.drug}>{item.drugName}</Text>
      <Body style={{ fontSize: 15 }}>{item.dose} · {item.route}</Body>
      {item.instructions ? <Body muted style={{ fontSize: 14 }}>{item.instructions}</Body> : null}
      {item.timesOfDay.map((time) => {
        const at = doseInstant(time);
        const logged = item.doseLogs?.find((l) => new Date(l.scheduledFor).getTime() === new Date(at).getTime());
        return (
          <View key={time} style={styles.dose}>
            <Text style={styles.time}>{time}</Text>
            {logged ? (
              <Pill tone={logged.status === 'GIVEN' ? 'success' : 'warning'} icon={logged.status === 'GIVEN' ? 'checkmark-circle' : 'remove-circle'} label={t(logged.status === 'GIVEN' ? 'medicines.given' : 'medicines.skipped')} />
            ) : (
              <View style={{ flexDirection: 'row', gap: spacing.xs, flex: 1, justifyContent: 'flex-end' }}>
                <Button title={t('medicines.markGiven')} icon="checkmark" loading={busy === at} onPress={() => log(at, 'GIVEN')} style={styles.small} />
                <Button title={t('medicines.markSkipped')} variant="ghost" onPress={() => log(at, 'SKIPPED')} style={styles.small} />
              </View>
            )}
          </View>
        );
      })}
      <ErrorText>{err}</ErrorText>
    </View>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  item: { gap: spacing.xs, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  drug: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  dose: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'space-between' },
  time: { fontFamily: fonts.bold, fontSize: 18, color: colors.blueDeep, width: 64 },
  small: { minHeight: 44, paddingHorizontal: spacing.md },
});
