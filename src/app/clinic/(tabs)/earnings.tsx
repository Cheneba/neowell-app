import { StyleSheet, Text, View } from 'react-native';
import { Body, Card, EmptyState, ErrorText, Loading, Pill, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { dateLabel, money } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

export default function Earnings() {
  const { t, locale } = useI18n();
  const { api } = useSession();
  const { data, error, loading } = useFocusData(() => api.earnings());
  if (loading && !data) return <Loading />;
  if (!data) return <Screen><ErrorText>{errorMessage(error, t)}</ErrorText></Screen>;
  return (
    <Screen>
      <View style={styles.tiles}>
        <Card tint={colors.pinkSoft} style={styles.tile}>
          <Body muted style={{ fontSize: 14 }}>{t('clinic.pending')}</Body>
          <Text style={styles.big}>{money(data.pendingXaf)}</Text>
        </Card>
        <Card tint={colors.greenSoft} style={styles.tile}>
          <Body muted style={{ fontSize: 14 }}>{t('clinic.paid')}</Body>
          <Text style={styles.big}>{money(data.paidXaf)}</Text>
        </Card>
      </View>
      <Body>{t('clinic.completed')}: {data.completedCount}</Body>
      <Text style={styles.h2}>{t('clinic.payouts')}</Text>
      {data.payouts.length === 0 ? <EmptyState icon="wallet-outline">—</EmptyState> : null}
      {data.payouts.map((p) => (
        <Card key={p.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.amount}>{money(p.amountXaf)}</Text>
            <Body muted style={{ fontSize: 13 }}>{dateLabel(p.paidAt ?? p.periodEnd, locale)}</Body>
          </View>
          <Pill tone={p.status === 'PAID' ? 'success' : 'warning'} label={t(p.status === 'PAID' ? 'clinic.paid' : 'clinic.pending')} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1 },
  big: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  h2: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center' },
  amount: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink },
});
