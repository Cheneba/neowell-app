import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COMPLAINTS, type Complaint } from '@/api/types';
import type { IconName } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, fonts, radius, spacing } from '@/theme';

const ICONS: Record<Complaint, IconName> = {
  FEVER: 'thermometer',
  FEELS_COLD: 'snow-outline',
  CRYING_A_LOT: 'volume-high-outline',
  NOT_CRYING_OR_WEAK: 'volume-mute-outline',
  NOT_FEEDING: 'water-outline',
  BREATHING_PROBLEM: 'pulse-outline',
  TWITCHING_OR_FITS: 'flash-outline',
  VOMITING: 'water',
  DIARRHEA: 'ellipse-outline',
  YELLOW_SKIN_OR_EYES: 'eye-outline',
  SKIN_COLOUR_CHANGE: 'color-palette-outline',
  CORD_PROBLEM: 'bandage-outline',
  OTHER: 'help-circle-outline',
};

/** Multi-select complaint tiles for the unwell flow (FR-CHK-03). */
export function ComplaintGrid({ selected, onToggle }: { selected: Complaint[]; onToggle: (c: Complaint) => void }) {
  const { t } = useI18n();
  return (
    <View style={styles.grid} accessibilityRole="list">
      {COMPLAINTS.map((c) => {
        const on = selected.includes(c);
        return (
          <Pressable
            key={c}
            onPress={() => onToggle(c)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={[styles.tile, on && styles.tileOn]}
          >
            <Ionicons name={ICONS[c]} size={26} color={on ? colors.white : colors.pinkDeep} />
            <Text style={[styles.label, on && { color: colors.white }]}>{t(`check.complaints.${c}`)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: '48%', minHeight: 84, borderRadius: radius.md, borderWidth: 2, borderColor: colors.pinkSoft, backgroundColor: colors.white, padding: spacing.sm, alignItems: 'center', justifyContent: 'center', gap: 6 },
  tileOn: { backgroundColor: colors.pinkDeep, borderColor: colors.pinkDeep },
  label: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, textAlign: 'center' },
});
