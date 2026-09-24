import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Baby, CheckSchedule, Observation } from '@/api/types';
import { Logo } from '@/components/logo';
import { RiskBadge } from '@/components/risk-badge';
import { Body, Button, Card, ErrorText, Loading, Title } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { ageLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, radius, spacing } from '@/theme';

type BabyOverview = Baby & { schedule: CheckSchedule; last?: Observation };

export default function Home() {
  const { t } = useI18n();
  const { api, me } = useSession();
  const { data, error, loading, reload } = useFocusData<BabyOverview[]>(async () => {
    const babies = await api.babies();
    return Promise.all(
      babies.map(async (b) => {
        const [schedule, recent] = await Promise.all([api.checkSchedule(b.id), api.observations(b.id, 1)]);
        return { ...b, schedule, last: recent[0] };
      }),
    );
  });

  const firstName = me?.fullName?.split(' ')[0];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Logo width={150} />
        <Link href="/settings" asChild>
          <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel={t('settings.title')}>
            <Ionicons name="settings-outline" size={24} color={colors.blueDeep} />
          </Pressable>
        </Link>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} tintColor={colors.blue} />}
      >
        <Title>{t('home.greeting', { name: firstName ? `, ${firstName}` : '' })}</Title>

        {loading && !data ? <Loading /> : null}
        {error ? (
          <>
            <ErrorText>{errorMessage(error, t)}</ErrorText>
            <Button title={t('common.retry')} variant="outline" onPress={reload} icon="refresh" />
          </>
        ) : null}

        {data?.length === 0 ? (
          <Card tint={colors.blueSoft} style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <Ionicons name="heart" size={40} color={colors.pink} />
            <Body style={{ textAlign: 'center' }}>{t('home.noBabies')}</Body>
          </Card>
        ) : null}

        {data?.map((b) => <BabyCard key={b.id} baby={b} />)}

        <Button title={t('home.addBaby')} variant="outline" icon="add-circle" onPress={() => router.push('/baby/new')} />
        <Button
          title={t('home.findFacility')}
          variant="ghost"
          icon="location"
          onPress={() => router.push('/facilities')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function BabyCard({ baby }: { baby: BabyOverview }) {
  const { t } = useI18n();
  const due = baby.schedule.checksDue;
  return (
    <Card>
      <Pressable
        onPress={() => router.push({ pathname: '/baby/[id]', params: { id: baby.id } })}
        style={styles.babyRow}
        accessibilityRole="button"
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{baby.name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.babyName}>{baby.name}</Text>
          <Body muted style={{ fontSize: 15 }}>{ageLabel(baby.dateOfBirth, t)}</Body>
          {baby.isHighRisk ? (
            <View style={styles.tag}>
              <Ionicons name="heart" size={12} color={colors.pinkDeep} />
              <Text style={styles.tagText}>{t('baby.highRisk')}</Text>
            </View>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.muted} />
      </Pressable>

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
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  babyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.pinkDeep },
  babyName: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  tagText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.pinkDeep },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  small: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  duePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.pinkSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 1,
  },
  dueText: { fontFamily: fonts.bold, fontSize: 13, color: colors.pinkDeep, flexShrink: 1 },
});
