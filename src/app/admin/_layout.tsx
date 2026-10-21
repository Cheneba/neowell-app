import { Stack } from 'expo-router';
import { stackOptions } from '@/components/nav';
import { useI18n } from '@/i18n';

export default function AdminLayout() {
  const { t } = useI18n();
  return (
    <Stack screenOptions={stackOptions(t('common.back'))}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="clinician/[id]" options={{ title: t('admin.reviewTitle') }} />
    </Stack>
  );
}
