import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/tabs';
import type { ColorValue } from 'react-native';
import { tabOptions } from '@/components/nav';
import type { IconName } from '@/components/ui';
import { useI18n } from '@/i18n';

const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  };

export default function ClinicTabs() {
  const { t } = useI18n();
  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen name="index" options={{ title: t('tabs.consultations'), tabBarIcon: icon('chatbubbles') }} />
      <Tabs.Screen name="earnings" options={{ title: t('clinic.earnings'), tabBarLabel: t('tabs.earnings'), tabBarIcon: icon('wallet') }} />
      <Tabs.Screen name="me" options={{ title: t('me.title'), tabBarLabel: t('tabs.me'), tabBarIcon: icon('person-circle') }} />
    </Tabs>
  );
}
