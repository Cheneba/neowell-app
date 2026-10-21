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

export default function AdminTabs() {
  const { t } = useI18n();
  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen name="index" options={{ title: t('admin.queue'), tabBarLabel: t('admin.queue'), tabBarIcon: icon('shield-checkmark') }} />
      <Tabs.Screen name="payouts" options={{ title: t('admin.payouts'), tabBarLabel: t('admin.payouts'), tabBarIcon: icon('wallet') }} />
      <Tabs.Screen name="jobs" options={{ title: t('admin.jobs'), tabBarLabel: t('admin.jobs'), tabBarIcon: icon('pulse') }} />
      <Tabs.Screen name="me" options={{ title: t('admin.overview'), tabBarLabel: t('admin.overview'), tabBarIcon: icon('stats-chart') }} />
    </Tabs>
  );
}
