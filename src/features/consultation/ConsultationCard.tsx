import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Consultation } from '@/api/types';
import { Avatar, Body, Card, Pill } from '@/components/ui';
import { useI18n } from '@/i18n';
import { babyName, timeLabel } from '@/lib/format';
import { colors, fonts, radius, spacing } from '@/theme';
import { MEDIUM_ICON, STATUS_TONE } from './status';

/** One consultation in a list. Caregivers see the doctor; clinicians see the baby. */
export function ConsultationCard({ c, viewer, onPress, children }: { c: Consultation; viewer: 'caregiver' | 'clinician'; onPress: () => void; children?: React.ReactNode }) {
  const { t, locale } = useI18n();
  const title = viewer === 'caregiver' ? c.clinician.displayName : babyName(c.baby.displayName, locale);
  return (
    <Card>
      <Pressable onPress={onPress} accessibilityRole="button" style={styles.row}>
        <Avatar name={title} uri={viewer === 'caregiver' ? c.clinician.photoUrl : null} size={48} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>{title}</Text>
          <Body muted style={{ fontSize: 14 }}>
            {viewer === 'caregiver' ? babyName(c.baby.displayName, locale) : t('clinic.mother', { name: [c.caregiver?.firstName, c.caregiver?.lastName].filter(Boolean).join(' ') })}
            {' · '}
            {timeLabel(c.scheduledAt, locale)}
          </Body>
          <View style={styles.pills}>
            <Pill tone={STATUS_TONE[c.status]} label={t(`consultation.status.${c.status}`)} />
            <Pill icon={MEDIUM_ICON[c.medium]} label={t(`doctors.media.${c.medium}`)} />
          </View>
        </View>
        {c.unreadCount ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{c.unreadCount}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        )}
      </Pressable>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink },
  pills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  badge: { minWidth: 26, height: 26, borderRadius: radius.pill, backgroundColor: colors.pinkDeep, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontFamily: fonts.extrabold, color: colors.white, fontSize: 13 },
});
