import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { Clinician, Consultation, Medium } from '@/api/types';
import { Banner, Button, EmptyState, ErrorText, Loading, Screen, Segmented } from '@/components/ui';
import { bookingContext } from '@/features/consultation/booking-context';
import { ClinicianCard } from '@/features/consultation/ClinicianCard';
import { ConsultationCard } from '@/features/consultation/ConsultationCard';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts } from '@/theme';

type Filter = 'ALL' | 'NOW' | Medium;

export default function Doctors() {
  const { t } = useI18n();
  const { api } = useSession();
  const [filter, setFilter] = useState<Filter>('ALL');
  const { data, error, loading, reload } = useFocusData<{ mine: Consultation[]; doctors: Clinician[] }>(async () => {
    const [mine, doctors] = await Promise.all([
      api.consultations('active'),
      api.clinicians({ medium: filter === 'ALL' || filter === 'NOW' ? undefined : filter, availableNow: filter === 'NOW' }),
    ]);
    return { mine, doctors };
  });

  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false;
    else void reload();
  }, [filter, reload]);
  const context = bookingContext.get();

  return (
    <Screen>
      {context ? <Banner tone="pink" icon="chatbubbles">{t('doctors.fromCheck')}</Banner> : null}
      {data?.mine.length ? <Text style={styles.h2}>{t('doctors.myConsultations')}</Text> : null}
      {data?.mine.map((c) => (
        <ConsultationCard key={c.id} c={c} viewer="caregiver" onPress={() => router.push({ pathname: '/consultation/[id]', params: { id: c.id } })} />
      ))}
      <Text style={styles.h2}>{t('doctors.find')}</Text>
      <Banner tone="info" icon="lock-closed">{t('doctors.privacy')}</Banner>
      <Segmented<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'ALL', label: t('doctors.all') },
          { value: 'NOW', label: t('doctors.availableNow') },
          { value: 'CHAT', label: t('doctors.media.CHAT') },
          { value: 'AUDIO', label: t('doctors.media.AUDIO') },
          { value: 'VIDEO', label: t('doctors.media.VIDEO') },
        ]}
      />
      {loading && !data ? <Loading /> : null}
      {error ? (
        <>
          <ErrorText>{errorMessage(error, t)}</ErrorText>
          <Button title={t('common.retry')} variant="outline" icon="refresh" onPress={reload} />
        </>
      ) : null}
      {data && data.doctors.length === 0 ? <EmptyState icon="medkit">{t('doctors.none')}</EmptyState> : null}
      {data?.doctors.map((c) => (
        <ClinicianCard key={c.id} c={c} onPress={() => router.push({ pathname: '/doctors/[id]', params: { id: c.id } })} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: fonts.extrabold, fontSize: 19, color: colors.ink },
});
