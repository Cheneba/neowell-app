import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Baby, CheckSchedule, DrugChart, Observation } from '@/api/types';
import { Logo } from '@/components/logo';
import { RiskBadge } from '@/components/risk-badge';
import { Avatar, Banner, Body, Button, Card, EmptyState, ErrorText, Loading, Pill, Title } from '@/components/ui';
import { tipFor } from '@/content/tips';
import { offlineQueue } from '@/features/checks/offline-queue';
import { scheduleCheckReminders, scheduleDoseAlarms } from '@/features/notifications/notifications';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { babyName, clockLabel, fullAgeLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, radius, spacing } from '@/theme';

type BabyOverview = Baby & { schedule: CheckSchedule; last?: Observation; charts: DrugChart[] };
type HomeData = { babies: BabyOverview[]; unread: number; queued: number };

export default function Home() {
  const { t, locale } = useI18n();
  const { api, me } = useSession();
  const { data, error, loading, reload } = useFocusData<HomeData>(async () => {
    await offlineQueue.flush(api).catch(() => 0);
    const [babies, inbox, queued] = await Promise.all([
      api.babies(),
      api.notifications().catch(() => ({ unreadCount: 0 })),
      offlineQueue.list(),
    ]);
    const overview = await Promise.all(
      babies.map(async (b) => {
        const [schedule, recent, charts] = await Promise.all([
          api.checkSchedule(b.id),
          api.observations(b.id, 1),
          api.drugCharts(b.id).catch(() => [] as DrugChart[]),
        ]);
        return { ...b, schedule, last: recent[0], charts };
      }),
    );
    return { babies: overview, unread: inbox.unreadCount, queued: queued.length };
  });

  // Keep on-device reminders in step with the server schedule (works offline afterwards).
  useEffect(() => {
    if (!data) return;
    const name = (b: Baby) => babyName(b.displayName, locale);
    void scheduleCheckReminders(
      data.babies.map((b) => ({ id: b.id, name: name(b), reminderTimes: b.schedule.reminderTimes })),
      (n) => ({ title: t('reminders.checkTitle', { name: n }), body: t('reminders.checkBody') }),
    );
    void scheduleDoseAlarms(
      data.babies.flatMap((b) => b.charts.map((c) => ({ ...c, babyName: name(b) }))),
      (d) => ({ title: t('reminders.doseTitle', { name: d.baby }), body: `${d.drugName} · ${d.dose} · ${d.route}` }),
    );
  }, [data, locale, t]);

  const recheck = data?.babies.find((b) => b.schedule.pendingRecheck);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Logo width={150} />
        <Pressable
          onPress={() => router.push('/inbox')}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={t('inbox.title')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.blueDeep} />
          {data?.unread ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} tintColor={colors.blue} />}
      >
        <Title>{t('home.greeting', { name: me?.firstName ? `, ${me.firstName}` : '' })}</Title>

        {loading && !data ? <Loading /> : null}
        {error ? (
          <>
            <ErrorText>{errorMessage(error, t)}</ErrorText>
            <Button title={t('common.retry')} variant="outline" onPress={reload} icon="refresh" />
          </>
        ) : null}

        {data?.queued ? <Banner tone="warning" icon="cloud-offline">{t('home.queued', { n: data.queued })}</Banner> : null}

        {recheck?.schedule.pendingRecheck ? (
          <Banner
            tone="danger"
            icon="thermometer"
            action={t('home.recheckNow')}
            onAction={() =>
              router.push({
                pathname: '/baby/[id]/check',
                params: { id: recheck.id, type: 'UNWELL', recheckOf: recheck.schedule.pendingRecheck!.id },
              })
            }
          >
            {`${t('home.recheckDue', { name: babyName(recheck.displayName, locale) })} · ${t('home.recheckIn', {
              time: clockLabel(recheck.schedule.pendingRecheck.dueAt, locale),
            })}`}
          </Banner>
        ) : null}

        {data?.babies.length === 0 ? (
          <Card tint={colors.blueSoft}>
            <EmptyState>{t('home.noBabies')}</EmptyState>
          </Card>
        ) : null}

        {data?.babies.map((b) => <BabyCard key={b.id} baby={b} />)}

        {data?.babies[0] ? (
          <Card tint={colors.pinkSoft}>
            <View style={styles.row}>
              <Ionicons name="bulb-outline" size={20} color={colors.pinkDeep} />
              <Text style={styles.tipTitle}>{t('home.tipTitle')}</Text>
            </View>
            <Body style={{ fontSize: 16 }}>{tipFor(data.babies[0].ageDays, locale)}</Body>
          </Card>
        ) : null}

        <Button title={t('home.addBaby')} variant="outline" icon="add-circle" onPress={() => router.push('/baby/new')} />
        <Button title={t('home.findFacility')} variant="ghost" icon="location" onPress={() => router.push('/facilities')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function BabyCard({ baby }: { baby: BabyOverview }) {
  const { t, locale } = useI18n();
  const name = babyName(baby.displayName, locale);
  const due = baby.schedule.checksDue;
  const open = () => router.push({ pathname: '/baby/[id]', params: { id: baby.id } });
  return (
    <Card>
      <Pressable onPress={open} style={styles.row} accessibilityRole="button">
        <Avatar name={name} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.babyName}>{name}</Text>
          <Body muted style={{ fontSize: 15 }}>{fullAgeLabel(baby, t)}</Body>
          {baby.isHighRisk ? <Pill tone="pink" icon="heart" label={t('baby.highRisk')} /> : null}
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.muted} />
      </Pressable>

      {baby.needsName ? (
        <Banner
          tone="pink"
          icon="create-outline"
          action={t('home.addName')}
          onAction={() => router.push({ pathname: '/baby/[id]/edit', params: { id: baby.id } })}
        >
          {t('home.needsName', { name })}
        </Banner>
      ) : null}

      {baby.schedule.paused ? (
        <Banner tone="info" icon="bed-outline">
          {t(baby.careStatus === 'KANGAROO_CARE' ? 'home.pausedKmc' : 'home.pausedHospital')}
        </Banner>
      ) : (
        <>
          <View style={styles.statusRow}>
            <View style={{ gap: 4 }}>
              <Text style={styles.small}>{t('home.lastResult')}</Text>
              {baby.last ? <RiskBadge level={baby.last.riskLevel} /> : <Body muted style={{ fontSize: 15 }}>{t('home.noChecksYet')}</Body>}
            </View>
            <View style={[styles.duePill, due === 0 && { backgroundColor: colors.greenSoft }]}>
              <Ionicons name={due === 0 ? 'checkmark-done' : 'time-outline'} size={16} color={due === 0 ? colors.green : colors.pinkDeep} />
              <Text style={[styles.dueText, due === 0 && { color: colors.green }]}>
                {due === 0 ? t('home.allDone') : t('home.checksDue', { n: due })}
              </Text>
            </View>
          </View>
          <Button
            title={t('home.startCheck')}
            icon="thermometer"
            onPress={() => router.push({ pathname: '/baby/[id]/check', params: { id: baby.id } })}
          />
        </>
      )}
      <Button
        title={t('home.unwell')}
        icon="medkit"
        variant="pink"
        onPress={() => router.push({ pathname: '/baby/[id]/check', params: { id: baby.id, type: 'UNWELL' } })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  dot: { position: 'absolute', top: 10, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.pinkDeep },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  babyName: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  tipTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.pinkDeep },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  small: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  duePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.pinkSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, flexShrink: 1 },
  dueText: { fontFamily: fonts.bold, fontSize: 13, color: colors.pinkDeep, flexShrink: 1 },
});
