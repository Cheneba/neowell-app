import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import type { Observation } from '@/api/types';
import { RiskBadge } from '@/components/risk-badge';
import { Body, Card, EmptyState, ErrorText, Loading, Pill, Screen } from '@/components/ui';
import { offlineQueue, type QueuedCheck } from '@/features/checks/offline-queue';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { timeLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, radius, spacing } from '@/theme';

export default function History() {
  const { t, locale } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const { data, error, loading } = useFocusData<{ list: Observation[]; queued: QueuedCheck[] }>(async () => {
    const [list, queued] = await Promise.all([api.observations(id, 50), offlineQueue.list()]);
    return { list, queued: queued.filter((q) => q.babyId === id) };
  });

  if (loading && !data) return <Loading />;
  if (!data) return <Screen><ErrorText>{errorMessage(error, t)}</ErrorText></Screen>;

  return (
    <Screen>
      {data.queued.map((q) => (
        <Card key={q.input.clientRef} tint={colors.yellowSoft}>
          <View style={styles.head}>
            <Text style={styles.date}>{timeLabel(q.input.observedAt ?? q.queuedAt, locale)}</Text>
            <Pill tone="warning" icon="cloud-offline" label={t('history.waiting')} />
          </View>
          <Body style={{ fontSize: 15 }}>{q.input.temperatureC} °C</Body>
        </Card>
      ))}
      {data.list.length === 0 && data.queued.length === 0 ? <EmptyState icon="list">{t('home.noChecksYet')}</EmptyState> : null}
      {data.list.map((o) => (
        <Card key={o.id}>
          <View style={styles.head}>
            <Ionicons name={o.checkType === 'UNWELL' ? 'medkit' : 'thermometer'} size={18} color={o.checkType === 'UNWELL' ? colors.pinkDeep : colors.blueDeep} />
            <Text style={[styles.date, { flex: 1 }]}>{timeLabel(o.observedAt, locale)}</Text>
            <RiskBadge level={o.riskLevel} />
          </View>
          <Body style={{ fontSize: 15 }}>
            {[o.temperatureC != null ? `${o.temperatureC} °C` : null, o.respiratoryRate != null ? t('check.breathResult', { n: o.respiratoryRate }) : null]
              .filter(Boolean)
              .join(' · ')}
          </Body>
          {o.complaints.length ? <Body muted style={{ fontSize: 14 }}>{o.complaints.map((c) => t(`check.complaints.${c}`)).join(', ')}</Body> : null}
          {o.findings.map((f) => (
            <Body key={f.code} style={{ fontSize: 14, color: f.level === 'RED' ? colors.red : colors.yellow }}>• {t(`findings.${f.code}`)}</Body>
          ))}
          {o.photoUrl ? <Image source={{ uri: o.photoUrl }} style={styles.photo} contentFit="cover" /> : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'space-between' },
  date: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  photo: { width: 120, height: 120, borderRadius: radius.md },
});
