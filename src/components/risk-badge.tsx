import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { fonts, radius, type RiskLevel, riskStyle } from '@/theme';
import type { IconName } from './ui';

/** Traffic-light status: always colour + icon + text, never colour alone. */
export function RiskBadge({ level, size = 'sm' }: { level: RiskLevel; size?: 'sm' | 'lg' }) {
  const { t } = useI18n();
  const s = riskStyle[level];
  const big = size === 'lg';
  return (
    <View
      style={[styles.badge, { backgroundColor: s.bg }, big && styles.big]}
      accessibilityLabel={t(`result.${level}`)}
    >
      <Ionicons name={s.icon as IconName} size={big ? 28 : 16} color={s.fg} />
      <Text style={[styles.text, { color: s.fg }, big && { fontSize: 22 }]}>{t(`result.${level}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  big: { paddingHorizontal: 18, paddingVertical: 10, alignSelf: 'center' },
  text: { fontFamily: fonts.bold, fontSize: 14 },
});
