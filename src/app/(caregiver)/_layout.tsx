import { Stack } from 'expo-router';
import { stackOptions } from '@/components/nav';
import { useI18n } from '@/i18n';

export default function CaregiverLayout() {
  const { t } = useI18n();
  return (
    <Stack screenOptions={stackOptions(t('common.back'))}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="baby/new" options={{ title: t('baby.newTitle') }} />
      <Stack.Screen name="baby/[id]/index" options={{ title: '' }} />
      <Stack.Screen name="baby/[id]/edit" options={{ title: t('baby.editTitle') }} />
      <Stack.Screen name="baby/[id]/growth" options={{ title: t('growth.title') }} />
      <Stack.Screen name="baby/[id]/measure" options={{ title: t('growth.measureTitle') }} />
      <Stack.Screen name="baby/[id]/check" options={{ title: t('check.title') }} />
      <Stack.Screen name="baby/[id]/history" options={{ title: t('baby.history') }} />
      <Stack.Screen name="baby/[id]/medicines" options={{ title: t('medicines.title') }} />
      <Stack.Screen name="result" options={{ title: t('result.title'), headerBackVisible: false, gestureEnabled: false }} />
      <Stack.Screen name="facilities" options={{ title: t('facilities.title') }} />
      <Stack.Screen name="doctors/[id]/index" options={{ title: '' }} />
      <Stack.Screen name="doctors/[id]/book" options={{ title: t('book.title') }} />
      <Stack.Screen name="consultation/[id]/index" options={{ title: t('consultation.title') }} />
      <Stack.Screen name="consultation/[id]/pay" options={{ title: t('pay.title') }} />
      <Stack.Screen name="consultation/[id]/review" options={{ title: t('consultation.review'), presentation: 'modal' }} />
    </Stack>
  );
}
