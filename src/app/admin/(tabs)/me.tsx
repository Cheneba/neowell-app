import { StyleSheet, Text, View } from 'react-native';
import { Body, Card, ErrorText, Loading, Pill, Screen } from '@/components/ui';
import { AccountSection } from '@/features/account/AccountSection';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { money } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

/** Admin overview: platform totals plus the shared account section. */
export default function AdminOverview() {
  const { t } = useI18n();
  const { api } = useSession();
  const { data, error, loading } = useFocusData(() => api.adminStats());
  if (loading && !data) return <Loading />;
  if (!data) return <Screen><ErrorText>{errorMessage(error, t)}</ErrorText></Screen>;

  return (
    <Screen>
      <View style={styles.tiles}>
        <Card tint={colors.blueSoft} style={styles.tile}>
          <Body muted style={{ fontSize: 14 }}>{t('admin.caregivers')}</Body>
          <Text style={styles.big}>{data.users.caregivers}</Text>
        </Card>
        <Card tint={colors.pinkSoft} style={styles.tile}>
          <Body muted style={{ fontSize: 14 }}>{t('admin.babies')}</Body>
          <Text style={styles.big}>{data.babies}</Text>
        </Card>
      </View>
      <View style={styles.tiles}>
        <Card tint={colors.greenSoft} style={styles.tile}>
          <Body muted style={{ fontSize: 14 }}>{t('admin.grossRevenue')}</Body>
          <Text style={styles.big}>{money(data.revenueXaf.gross)}</Text>
        </Card>
        <Card style={styles.tile}>
          <Body muted style={{ fontSize: 14 }}>{t('admin.commission')}</Body>
          <Text style={styles.big}>{money(data.revenueXaf.commission)}</Text>
        </Card>
      </View>

      <Text style={styles.h2}>{t('admin.clinicians')}</Text>
      <Card>
        {Object.entries(data.users.clinicians).map(([k, n]) => (
          <View key={k} style={styles.row}>
            <Body>{t(`admin.filters.${k}`)}</Body>
            <Pill label={String(n)} tone="info" />
          </View>
        ))}
      </Card>

      <Text style={styles.h2}>{t('admin.consultations')}</Text>
      <Card>
        {Object.entries(data.consultations).map(([k, n]) => (
          <View key={k} style={styles.row}>
            <Body>{k}</Body>
            <Pill label={String(n)} tone="info" />
          </View>
        ))}
      </Card>

      <Text style={styles.h2}>{t('admin.checks')}</Text>
      <Card>
        {Object.entries(data.checks).map(([k, n]) => (
          <View key={k} style={styles.row}>
            <Body>{k}</Body>
            <Pill label={String(n)} tone={k === 'RED' ? 'danger' : k === 'YELLOW' ? 'warning' : 'success'} />
          </View>
        ))}
      </Card>

      <AccountSection />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, gap: spacing.xs },
  big: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  h2: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
});
