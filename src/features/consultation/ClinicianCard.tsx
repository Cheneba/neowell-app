import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Clinician, Medium } from '@/api/types';
import { Avatar, Body, Card, Pill } from '@/components/ui';
import { useI18n } from '@/i18n';
import { money } from '@/lib/format';
import { colors, fonts, spacing } from '@/theme';
import { MEDIUM_ICON } from './status';

export function ClinicianHeader({ c, size = 64 }: { c: Clinician; size?: number }) {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <Avatar name={c.displayName} uri={c.photoUrl} size={size} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{c.displayName}</Text>
          {c.verified ? <Ionicons name="checkmark-circle" size={18} color={colors.blueDeep} accessibilityLabel={t('doctors.verified')} /> : null}
        </View>
        <Body muted style={{ fontSize: 14 }}>{c.specialties.join(' · ')}</Body>
        <View style={styles.nameRow}>
          <Ionicons name="heart" size={14} color={colors.pink} />
          <Body style={{ fontSize: 14 }}>
            {c.ratingCount ? t('doctors.rating', { avg: (c.ratingAvg ?? 0).toFixed(1), n: c.ratingCount }) : t('doctors.noRating')}
          </Body>
          {c.availableNow ? <Pill tone="success" icon="ellipse" label={t('doctors.availableNow')} /> : null}
        </View>
      </View>
    </View>
  );
}

export function FeeChips({ media }: { media: Clinician['media'] }) {
  const { t } = useI18n();
  return (
    <View style={styles.fees}>
      {(Object.keys(media) as Medium[]).map((m) => (
        <Pill key={m} icon={MEDIUM_ICON[m]} label={`${t(`doctors.media.${m}`)} · ${money(media[m]!)}`} />
      ))}
    </View>
  );
}

export function ClinicianCard({ c, onPress }: { c: Clinician; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.85 }}>
      <Card>
        <ClinicianHeader c={c} />
        <FeeChips media={c.media} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  fees: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
