import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Baby, CheckSchedule, Consultation, DrugChart, Growth, Observation } from '@/api/types';
import { RiskBadge } from '@/components/risk-badge';
import { Avatar, Banner, Body, Button, Card, ErrorText, ListRow, Loading, Pill, Screen, Title } from '@/components/ui';
import { GrowthRow } from '@/features/growth/GrowthRow';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { babyName, clockLabel, fullAgeLabel, timeLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

type Overview = {
  baby: Baby;
  schedule: CheckSchedule;
  growth: Growth;
  recent: Observation[];
  charts: DrugChart[];
  consultations: Consultation[];
};

export default function BabyOverview() {
  const { t, locale } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const [busy, setBusy] = useState(false);
  const { data, error, loading, reload } = useFocusData<Overview>(async () => {
    const [baby, schedule, growth, recent, charts, consultations] = await Promise.all([
      api.baby(id),
      api.checkSchedule(id),
      api.growth(id),
      api.observations(id, 3),
      api.drugCharts(id).catch(() => []),
      api.consultations().catch(() => []),
    ]);
    return { baby, schedule, growth, recent, charts, consultations: consultations.filter((c) => c.baby.id === id) };
  });

  if (loading && !data) return <Loading />;
  if (!data) return <Screen><ErrorText>{errorMessage(error, t)}</ErrorText><Button title={t('common.retry')} variant="outline" onPress={reload} /></Screen>;

  const { baby, schedule, growth, recent, charts, consultations } = data;
  const name = babyName(baby.displayName, locale);
  const go = (path: 'growth' | 'history' | 'medicines' | 'edit' | 'check') => router.push({ pathname: `/baby/[id]/${path}`, params: { id } });

  async function homeNow() {
    setBusy(true);
    await api.updateBaby(id, { careStatus: 'AT_HOME', dischargeDate: new Date().toISOString() }).catch(() => undefined);
    setBusy(false);
    void reload();
  }

  return (
    <Screen
      footer={
        <>
          {schedule.paused ? null : <Button title={t('home.startCheck')} icon="thermometer" onPress={() => go('check')} />}
          <Button title={t('home.unwell')} icon="medkit" variant="pink" onPress={() => router.push({ pathname: '/baby/[id]/check', params: { id, type: 'UNWELL' } })} />
        </>
      }
    >
      <Stack.Screen options={{ title: name, headerRight: () => <Button title={t('baby.edit')} variant="ghost" onPress={() => go('edit')} /> }} />
      <View style={styles.hero}>
        <Avatar name={name} size={84} />
        <Title>{name}</Title>
        {baby.givenName && baby.givenName !== baby.displayName ? <Body muted>{baby.givenName}</Body> : null}
        <Body muted>{fullAgeLabel(baby, t)}</Body>
        {baby.termStatus ? <Pill label={t(`termStatus.${baby.termStatus}`)} /> : null}
      </View>

      {baby.needsName ? (
        <Banner tone="pink" icon="create-outline" action={t('home.addName')} onAction={() => go('edit')}>
          {t('home.needsName', { name })}
        </Banner>
      ) : null}

      {baby.riskFactors.length ? (
        <Card tint={colors.pinkSoft}>
          <Text style={styles.h2}>{t('baby.highRisk')}</Text>
          {baby.riskFactors.map((r) => (
            <Body key={r.code} style={{ fontSize: 15 }}>• {t(`riskFactors.${r.code}`)}</Body>
          ))}
        </Card>
      ) : null}

      {schedule.paused ? (
        <Banner tone="info" icon="bed-outline" action={t('baby.homeNow')} onAction={busy ? undefined : homeNow}>
          {t(baby.careStatus === 'KANGAROO_CARE' ? 'home.pausedKmc' : 'home.pausedHospital')}
        </Banner>
      ) : (
        <Card>
          <Text style={styles.h2}>{t('baby.today')}</Text>
          <Body>{t('baby.schedule', { n: schedule.checksPerDay })} · {schedule.reminderTimes.join(' · ')}</Body>
          <Body muted>{schedule.checksDue === 0 ? t('home.allDone') : t('home.checksDue', { n: schedule.checksDue })}</Body>
          {schedule.pendingRecheck ? (
            <Banner
              tone="danger"
              icon="thermometer"
              action={t('home.recheckNow')}
              onAction={() => router.push({ pathname: '/baby/[id]/check', params: { id, type: 'UNWELL', recheckOf: schedule.pendingRecheck!.id } })}
            >
              {t('home.recheckIn', { time: clockLabel(schedule.pendingRecheck.dueAt, locale) })}
            </Banner>
          ) : null}
        </Card>
      )}

      <Card>
        <ListRow icon="trending-up" title={t('baby.growth')} onPress={() => go('growth')} />
        <GrowthRow label={t('growth.weight')} item={growth.latest.weight} />
        <GrowthRow label={t('growth.length')} item={growth.latest.length} />
        <GrowthRow label={t('growth.headCircumference')} item={growth.latest.headCircumference} />
        {growth.flags.filter((f) => f.code === 'EXCESS_WEIGHT_LOSS').map((f) => (
          <Banner key={f.code} tone={f.level === 'RED' ? 'danger' : 'warning'}>{t(`growth.${f.code}`)}</Banner>
        ))}
      </Card>

      <Card>
        <ListRow icon="list" title={t('baby.history')} onPress={() => go('history')} />
        {recent.length === 0 ? <Body muted>{t('home.noChecksYet')}</Body> : null}
        {recent.map((o) => (
          <View key={o.id} style={styles.checkRow}>
            <Body style={{ flex: 1, fontSize: 15 }}>
              {timeLabel(o.observedAt, locale)}
              {o.temperatureC != null ? ` · ${o.temperatureC} °C` : ''}
            </Body>
            <RiskBadge level={o.riskLevel} />
          </View>
        ))}
      </Card>

      <Card>
        <ListRow icon="medical" title={t('baby.medicines')} onPress={() => go('medicines')} />
        {charts.filter((c) => c.active !== false).length === 0 ? <Body muted>{t('baby.noMedicines')}</Body> : null}
        {charts
          .filter((c) => c.active !== false)
          .flatMap((c) => c.items)
          .map((i) => (
            <Body key={i.id} style={{ fontSize: 15 }}>• {i.drugName} — {i.dose}, {i.timesOfDay.join(' · ')}</Body>
          ))}
      </Card>

      {consultations.length ? (
        <Card>
          <Text style={styles.h2}>{t('baby.consultations')}</Text>
          {consultations.map((c) => (
            <ListRow
              key={c.id}
              icon="chatbubbles-outline"
              title={c.clinician.displayName}
              subtitle={`${t(`consultation.status.${c.status}`)} · ${timeLabel(c.scheduledAt, locale)}`}
              onPress={() => router.push({ pathname: '/consultation/[id]', params: { id: c.id } })}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs },
  h2: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
