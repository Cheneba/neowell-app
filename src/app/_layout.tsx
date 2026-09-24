import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nProvider } from '@/i18n';
import { SessionProvider, useSession } from '@/lib/session';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

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

function RootNavigator() {
  const { status, me } = useSession();
  const signedIn = status === 'signedIn';
  const consented = !!me?.consentDataCollectionAt;

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hide();
  }, [status]);

  if (status === 'loading') return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !consented}>
        <Stack.Screen name="consent" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && consented}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
