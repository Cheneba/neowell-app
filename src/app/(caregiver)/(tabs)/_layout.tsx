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

export default function CaregiverTabs() {
  const { t } = useI18n();
  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), headerShown: false, tabBarIcon: icon('home') }} />
      <Tabs.Screen name="doctors" options={{ title: t('doctors.title'), tabBarLabel: t('tabs.doctors'), tabBarIcon: icon('medkit') }} />
      <Tabs.Screen name="inbox" options={{ title: t('inbox.title'), tabBarLabel: t('tabs.inbox'), tabBarIcon: icon('notifications') }} />
      <Tabs.Screen name="me" options={{ title: t('me.title'), tabBarLabel: t('tabs.me'), tabBarIcon: icon('person-circle') }} />
    </Tabs>
  );
}
