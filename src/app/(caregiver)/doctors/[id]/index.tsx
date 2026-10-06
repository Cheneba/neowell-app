import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Body, Button, Card, ErrorText, Loading, Screen } from '@/components/ui';
import { ClinicianHeader, FeeChips } from '@/features/consultation/ClinicianCard';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { minutesLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

export default function DoctorProfile() {
  const { t, list } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const { data: c, error, loading } = useFocusData(() => api.clinician(id));
  const days = list('days');

  if (loading && !c) return <Loading />;
  if (!c) return <Screen><ErrorText>{errorMessage(error, t)}</ErrorText></Screen>;

  return (
    <Screen footer={<Button title={t('doctors.book')} icon="calendar" variant="pink" onPress={() => router.push({ pathname: '/doctors/[id]/book', params: { id } })} />}>
      <Stack.Screen options={{ title: c.displayName }} />
      <ClinicianHeader c={c} size={84} />
      <FeeChips media={c.media} />
      {c.bio ? <Body>{c.bio}</Body> : null}
      <Card>
        {c.currentFacility ? <Body>🏥 {c.currentFacility}</Body> : null}
        {c.yearsExperience != null ? <Body>{t('doctors.years', { n: c.yearsExperience })}</Body> : null}
      </Card>
      {c.availability?.length ? (
        <Card>
          <Text style={styles.h2}>{t('clinic.availability')}</Text>
          {c.availability.map((a, i) => (
            <View key={i} style={styles.row}>
              <Body style={{ flex: 1 }}>{days[a.dayOfWeek]}</Body>
              <Body>{minutesLabel(a.startMinute)} – {minutesLabel(a.endMinute)}</Body>
            </View>
          ))}
        </Card>
      ) : null}
      <Banner tone="info" icon="lock-closed">{t('doctors.privacy')}</Banner>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  row: { flexDirection: 'row', gap: spacing.sm },
});
