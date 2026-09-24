import { Stack } from 'expo-router';
import { useI18n } from '@/i18n';
import { colors, fonts } from '@/theme';

export default function AppLayout() {
  const { t } = useI18n();
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.blueDeep,
        headerTitleStyle: { fontFamily: fonts.bold, color: colors.ink },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.white },
        headerBackTitle: t('common.back'),
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="baby/new" options={{ title: t('baby.newTitle') }} />
      <Stack.Screen name="baby/[id]/index" options={{ title: '' }} />
      <Stack.Screen name="baby/[id]/check" options={{ title: t('check.title') }} />
      <Stack.Screen name="result" options={{ title: t('result.title'), headerBackVisible: false, gestureEnabled: false }} />
      <Stack.Screen name="facilities" options={{ title: t('facilities.title') }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
    </Stack>
  );
}
