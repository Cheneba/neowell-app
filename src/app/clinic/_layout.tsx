import { Stack } from 'expo-router';
import { stackOptions } from '@/components/nav';
import { Button, ErrorText, Loading, Screen } from '@/components/ui';
import { ClinicianProvider, useClinician } from '@/features/clinician/clinician-context';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';

export default function ClinicLayout() {
  return (
    <ClinicianProvider>
      <ClinicStack />
    </ClinicianProvider>
  );
}

function ClinicStack() {
  const { t } = useI18n();
  const { profile, loading, error, reload } = useClinician();
  if (loading) return <Loading />;
  if (error && !profile) {
    return (
      <Screen>
        <ErrorText>{errorMessage(error, t)}</ErrorText>
        <Button title={t('common.retry')} variant="outline" icon="refresh" onPress={reload} />
      </Screen>
    );
  }
  const hasProfile = !!profile;
  return (
    <Stack screenOptions={stackOptions(t('common.back'))}>
      <Stack.Protected guard={!hasProfile}>
        <Stack.Screen name="setup" options={{ title: t('clinic.setupTitle'), headerBackVisible: false }} />
      </Stack.Protected>
      <Stack.Protected guard={hasProfile}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: t('clinic.editProfile') }} />
        <Stack.Screen name="documents" options={{ title: t('clinic.verification') }} />
        <Stack.Screen name="availability" options={{ title: t('clinic.availability') }} />
        <Stack.Screen name="consultation/[id]/index" options={{ title: t('consultation.title') }} />
        <Stack.Screen name="consultation/[id]/patient" options={{ title: t('clinic.patient') }} />
        <Stack.Screen name="consultation/[id]/refer" options={{ title: t('clinic.referTitle') }} />
        <Stack.Screen name="consultation/[id]/prescribe" options={{ title: t('clinic.prescribeTitle') }} />
      </Stack.Protected>
    </Stack>
  );
}
