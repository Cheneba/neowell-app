import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AdminJob } from '@/api/types';
import { Body, Card, EmptyState, ErrorText, Loading, Pill, Screen, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { timeLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

type Status = AdminJob['status'];
const STATUSES: Status[] = ['FAILED', 'RUNNING', 'QUEUED', 'DONE'];

/** Background-job inspector — failed jobs first, so admins can spot stuck work. */
export default function AdminJobs() {
  const { t, locale } = useI18n();
  const { api } = useSession();
  const [status, setStatus] = useState<Status>('FAILED');
  const { data, error, loading, reload } = useFocusData(() => api.adminJobs(status));

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void reload();
  }, [status, reload]);

  return (
    <Screen>
      <Segmented<Status>
        value={status}
        onChange={setStatus}
        options={STATUSES.map((s) => ({ value: s, label: t(`admin.jobStatus.${s}`) }))}
      />
      {loading && !data ? <Loading /> : null}
      {error ? <ErrorText>{errorMessage(error, t)}</ErrorText> : null}
      {data && data.length === 0 ? <EmptyState icon="pulse-outline">{t('admin.noJobs')}</EmptyState> : null}
      {data?.map((j) => (
        <Card key={j.id} style={{ gap: spacing.xs }}>
          <View style={styles.head}>
            <Text style={styles.queue}>{j.queue}</Text>
            <Pill tone={j.status === 'FAILED' ? 'danger' : j.status === 'DONE' ? 'success' : 'info'} label={t(`admin.jobStatus.${j.status}`)} />
          </View>
          <Body muted style={{ fontSize: 13 }}>#{j.id.slice(0, 8)} · {t('admin.attempts', { n: j.attempts, max: j.maxAttempts })}</Body>
          <Body muted style={{ fontSize: 12 }}>{timeLabel(j.createdAt, locale)}</Body>
          {j.lastError ? (
            <Body style={{ fontSize: 13, color: colors.red }}>{t('admin.lastError')}: {j.lastError}</Body>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  queue: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
});
