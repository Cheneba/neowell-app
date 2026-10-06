import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { router, SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Body, Button, Screen, Title } from '@/components/ui';
import { configureNotifications, onNotificationTap } from '@/features/notifications/notifications';
import { I18nProvider, useI18n } from '@/i18n';
import { SessionProvider, useSession } from '@/lib/session';
import { colors, spacing } from '@/theme';

SplashScreen.preventAutoHideAsync();
configureNotifications();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  return (
    <I18nProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        {fontsLoaded ? <RootNavigator /> : null}
      </SessionProvider>
    </I18nProvider>
  );
}

/** Routes by session state (design guide §5): auth → onboarding → caregiver or clinician area. */
function RootNavigator() {
  const { status, me } = useSession();
  const signedIn = status === 'signedIn' && !!me;
  const needsProfile = signedIn && !me.profileComplete;
  const needsConsent = signedIn && me.role === 'CAREGIVER' && !me.consentDataCollectionAt;
  const ready = signedIn && !needsProfile && !needsConsent;
  const isClinician = me?.role === 'CLINICIAN';

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hide();
  }, [status]);

  // Deep links from notifications. Server links are caregiver paths; clinicians have theirs under /clinic.
  useEffect(
    () =>
      onNotificationTap((url) => {
        if (!ready) return;
        router.push((isClinician && url.startsWith('/consultation/') ? `/clinic${url}` : url) as never);
      }),
    [ready, isClinician],
  );

  if (status === 'loading') return null;
  if (status === 'signedIn' && !me) return <Offline />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={needsProfile || needsConsent}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={ready && !isClinician}>
        <Stack.Screen name="(caregiver)" />
      </Stack.Protected>
      <Stack.Protected guard={ready && isClinician}>
        <Stack.Screen name="clinic" />
      </Stack.Protected>
    </Stack>
  );
}

/** Signed in, but the profile could not be loaded (no internet at start-up). */
function Offline() {
  const { t } = useI18n();
  const { refreshMe, signOut } = useSession();
  return (
    <Screen
      footer={
        <>
          <Button title={t('common.retry')} icon="refresh" onPress={() => refreshMe().catch(() => undefined)} />
          <Button title={t('me.signOut')} variant="ghost" onPress={signOut} />
        </>
      }
    >
      <Title style={{ marginTop: spacing.xl }}>NeoWell</Title>
      <Body>{t('common.networkError')}</Body>
    </Screen>
  );
}
