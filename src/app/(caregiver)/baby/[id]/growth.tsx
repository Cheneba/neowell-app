import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import type { Growth, Measurement } from '@/api/types';
import { Banner, Body, Button, Card, ErrorText, Loading, Screen } from '@/components/ui';
import { formatMeasure, GrowthRow } from '@/features/growth/GrowthRow';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { dateLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

export default function GrowthScreen() {
  const { t, locale } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const { data, error, loading } = useFocusData<{ growth: Growth; list: Measurement[] }>(async () => {
    const [growth, list] = await Promise.all([api.growth(id), api.measurements(id)]);
    return { growth, list };
  });

  if (loading && !data) return <Loading />;
  if (!data) return <Screen><ErrorText>{errorMessage(error, t)}</ErrorText></Screen>;
  const { growth, list } = data;

  return (
    <Screen footer={<Button title={t('growth.update')} icon="create-outline" onPress={() => router.push({ pathname: '/baby/[id]/measure', params: { id } })} />}>
      <Card>
        <GrowthRow label={t('growth.weight')} item={growth.latest.weight} />
        <GrowthRow label={t('growth.length')} item={growth.latest.length} />
        <GrowthRow label={t('growth.headCircumference')} item={growth.latest.headCircumference} />
      </Card>
      {growth.flags.some((f) => f.code === 'EXCESS_WEIGHT_LOSS') ? <Banner tone="warning">{t('growth.EXCESS_WEIGHT_LOSS')}</Banner> : null}
      {growth.usesCorrectedAge ? <Banner tone="info">{t('growth.correctedNote')}</Banner> : null}

      <Text style={styles.h2}>{t('growth.history')}</Text>
      {list.length === 0 ? <Body muted>{t('growth.noData')}</Body> : null}
      {[...list]
        .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
        .map((m) => (
          <Card key={m.id} style={{ gap: 4 }}>
            <View style={styles.head}>
              <Text style={styles.date}>{dateLabel(m.measuredAt, locale)}</Text>
              <Body muted style={{ fontSize: 14 }}>{t(`growth.source.${m.source}`)}</Body>
            </View>
            <Body style={{ fontSize: 15 }}>
              {[
                m.weightGrams != null ? `${t('growth.weight')} ${formatMeasure({ value: m.weightGrams, unit: 'g' }, locale)}` : null,
                m.lengthCm != null ? `${t('growth.length')} ${formatMeasure({ value: Number(m.lengthCm), unit: 'cm' }, locale)}` : null,
                m.headCircumferenceCm != null ? `${t('growth.headCircumference')} ${formatMeasure({ value: Number(m.headCircumferenceCm), unit: 'cm' }, locale)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Body>
            {m.notes ? <Body muted style={{ fontSize: 14 }}>{m.notes}</Body> : null}
          </Card>
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink, marginTop: spacing.sm },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
});
