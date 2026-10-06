import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Consultation } from '@/api/types';
import { Banner, Body, Button, Card, EmptyState, ErrorText, Loading, Screen, Segmented } from '@/components/ui';
import { useClinician } from '@/features/clinician/clinician-context';
import { ConsultationCard } from '@/features/consultation/ConsultationCard';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { clockLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

type Minutes = '0' | '60' | '120' | '240';

export default function ClinicConsultations() {
  const { t, locale } = useI18n();
  const { api } = useSession();
  const { profile, reload: reloadProfile } = useClinician();
  const { data, error, loading, reload } = useFocusData(async () => {
    const [active, past] = await Promise.all([api.consultations('active'), api.consultations('past')]);
    return { active, past };
  });
  const until = profile?.availableNowUntil && new Date(profile.availableNowUntil) > new Date() ? profile.availableNowUntil : null;
  const [now, setNow] = useState<Minutes>(until ? '60' : '0');
  const [actionError, setActionError] = useState<string>();

  async function setAvailable(m: Minutes) {
    setNow(m);
    try {
      await api.setAvailableNow(Number(m));
      await reloadProfile();
    } catch (e) {
      setActionError(errorMessage(e, t));
    }
  }

  async function act(c: Consultation, action: 'accept' | 'decline') {
    try {
      await api.consultationAction(c.id, action);
      await reload();
    } catch (e) {
      setActionError(errorMessage(e, t));
    }
  }

  const open = (c: Consultation) => router.push({ pathname: '/clinic/consultation/[id]', params: { id: c.id } });
  const requests = data?.active.filter((c) => c.status === 'REQUESTED') ?? [];
  const upcoming = data?.active.filter((c) => c.status !== 'REQUESTED' && c.status !== 'AWAITING_PAYMENT') ?? [];
  const verified = profile?.verificationStatus === 'VERIFIED';

  return (
    <Screen>
      {!verified ? (
        <Banner tone="warning" icon="shield-outline" action={t('clinic.verification')} onAction={() => router.push('/clinic/documents')}>
          {`${t(`clinic.statusTitle.${profile?.verificationStatus ?? 'PENDING_DOCUMENTS'}`)}. ${t('clinic.notVerified')}`}
        </Banner>
      ) : (
        <Card tint={colors.greenSoft}>
          <Text style={styles.h2}>{t('clinic.availableNow')}</Text>
          <Segmented<Minutes>
            value={now}
            onChange={setAvailable}
            options={[
              { value: '0', label: t('clinic.off') },
              { value: '60', label: t('clinic.availableFor', { h: 1 }) },
              { value: '120', label: t('clinic.availableFor', { h: 2 }) },
              { value: '240', label: t('clinic.availableFor', { h: 4 }) },
            ]}
          />
          {until ? <Body muted style={{ fontSize: 14 }}>→ {clockLabel(until, locale)}</Body> : null}
        </Card>
      )}
      <ErrorText>{actionError}</ErrorText>
      {loading && !data ? <Loading /> : null}
      {error ? <ErrorText>{errorMessage(error, t)}</ErrorText> : null}

      <Text style={styles.h2}>{t('clinic.requests')}</Text>
      {data && requests.length === 0 ? <Body muted>{t('clinic.noRequests')}</Body> : null}
      {requests.map((c) => (
        <ConsultationCard key={c.id} c={c} viewer="clinician" onPress={() => open(c)}>
          {c.reason ? <Body muted style={{ fontSize: 14 }}>“{c.reason}”</Body> : null}
          {c.acceptDeadline ? <Body style={{ fontSize: 14, color: colors.pinkDeep }}>{t('clinic.acceptBy', { time: clockLabel(c.acceptDeadline, locale) })}</Body> : null}
          <View style={styles.actions}>
            <Button title={t('clinic.accept')} icon="checkmark" onPress={() => act(c, 'accept')} style={{ flex: 1 }} />
            <Button title={t('clinic.decline')} variant="ghost" onPress={() => act(c, 'decline')} />
          </View>
        </ConsultationCard>
      ))}

      <Text style={styles.h2}>{t('clinic.upcoming')}</Text>
      {data && upcoming.length === 0 ? <Body muted>{t('clinic.noRequests')}</Body> : null}
      {upcoming.map((c) => (
        <ConsultationCard key={c.id} c={c} viewer="clinician" onPress={() => open(c)} />
      ))}

      {data?.past.length ? <Text style={styles.h2}>{t('clinic.past')}</Text> : null}
      {data?.past.map((c) => (
        <ConsultationCard key={c.id} c={c} viewer="clinician" onPress={() => open(c)} />
      ))}
      {data && data.active.length === 0 && data.past.length === 0 ? <EmptyState icon="chatbubbles-outline">{t('clinic.noRequests')}</EmptyState> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});
