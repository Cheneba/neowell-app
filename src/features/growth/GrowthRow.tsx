import { StyleSheet, Text, View } from 'react-native';
import type { GrowthFlag, GrowthItem } from '@/api/types';
import { Pill } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, fonts, spacing } from '@/theme';

const TONE: Record<GrowthFlag, 'success' | 'warning' | 'danger'> = { NORMAL: 'success', OUT_OF_RANGE: 'warning', FAR_OUT_OF_RANGE: 'danger' };

export function formatMeasure(item: Pick<GrowthItem, 'value' | 'unit'>, locale: string) {
  return item.unit === 'g'
    ? `${(item.value / 1000).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 2 })} kg`
    : `${item.value.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB')} cm`;
}

/** One latest measurement with its WHO flag (design guide §6.2 Growth). */
export function GrowthRow({ label, item }: { label: string; item: GrowthItem | null }) {
  const { t, locale } = useI18n();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.label}>{label}</Text>
        {item?.flag ? <Pill tone={TONE[item.flag]} label={t(`growth.${item.flag}`)} /> : null}
      </View>
      <Text style={styles.value}>{item ? formatMeasure(item, locale) : '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  label: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  value: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.blueDeep },
});
