import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { RiskBadge } from '@/components/risk-badge';
import { Body, Button, Card, ErrorText, Loading, Screen, Title } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { ageLabel, timeLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

export default function BabyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { api } = useSession();
  const { data, error, loading, reload } = useFocusData(async () => {
    const [baby, schedule, observations] = await Promise.all([
      api.baby(id),
      api.checkSchedule(id),
      api.observations(id, 20),
    ]);
    return { baby, schedule, observations };
  });

  if (loading && !data) return <Loading />;
  if (!data) {
    return (
      <Screen>
        <ErrorText>{errorMessage(error, t)}</ErrorText>
        <Button title={t('common.retry')} variant="outline" onPress={reload} />
      </Screen>
    );
  }

  const { baby, schedule, observations } = data;
  return (
    <Screen
      footer={
        <Button
          title={t('home.startCheck')}
          icon="thermometer"
          onPress={() => router.push({ pathname: '/baby/[id]/check', params: { id } })}
        />
      }
    >
      <Stack.Screen options={{ title: baby.name }} />
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{baby.name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Title>{baby.name}</Title>
        <Body muted>{ageLabel(baby.dateOfBirth, t)}</Body>
        {baby.isHighRisk ? (
          <View style={styles.tag}>
            <Ionicons name="heart" size={14} color={colors.pinkDeep} />
            <Text style={styles.tagText}>{t('baby.highRisk')}</Text>
          </View>
        ) : null}
      </View>

      <Card tint={colors.blueSoft}>
        <View style={styles.row}>
          <Ionicons name="alarm-outline" size={22} color={colors.blueDeep} />
          <Text style={styles.scheduleText}>{t('baby.schedule', { n: schedule.checksPerDay })}</Text>
        </View>
        <Body muted style={{ fontSize: 15 }}>{schedule.reminderTimes.join(' · ')}</Body>
        <Body style={{ fontFamily: fonts.bold, color: schedule.checksDue ? colors.pinkDeep : colors.green }}>
          {schedule.checksDue ? t('home.checksDue', { n: schedule.checksDue }) : t('home.allDone')}
        </Body>
      </Card>

      <Title style={{ fontSize: 20 }}>{t('baby.history')}</Title>
      {observations.length === 0 ? <Body muted>{t('home.noChecksYet')}</Body> : null}
      {observations.map((o) => (
        <Card key={o.id} style={{ gap: spacing.xs }}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Body style={{ fontFamily: fonts.semibold, fontSize: 15 }}>{timeLabel(o.observedAt, locale)}</Body>
            {o.temperatureC != null ? (
              <Body style={{ fontFamily: fonts.bold }}>{o.temperatureC.toFixed(1)} °C</Body>
            ) : null}
          </View>
          <RiskBadge level={o.riskLevel} />
          {o.findings.length ? (
            <Body muted style={{ fontSize: 14 }}>{o.findings.map((f) => t(`findings.${f.code}`)).join(' · ')}</Body>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 36, color: colors.pinkDeep },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.pinkDeep },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scheduleText: { fontFamily: fonts.bold, fontSize: 17, color: colors.blueDeep },
});
