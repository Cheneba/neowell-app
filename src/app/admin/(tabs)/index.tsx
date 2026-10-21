import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { VerificationStatus } from '@/api/types';
import { Avatar, Body, Card, EmptyState, ErrorText, Loading, Pill, Screen, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { dateLabel } from '@/lib/format';
import { formatPhone } from '@/lib/phone';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

const FILTERS: VerificationStatus[] = [
  'PENDING_REVIEW',
  'PENDING_DOCUMENTS',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
];

const TONE: Record<VerificationStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  PENDING_DOCUMENTS: 'warning',
  PENDING_REVIEW: 'info',
  VERIFIED: 'success',
  REJECTED: 'danger',
  SUSPENDED: 'danger',
};

/** Admin verification queue: clinicians by status, newest submissions first. */
export default function AdminQueue() {
  const { t, locale } = useI18n();
  const { api } = useSession();
  const [filter, setFilter] = useState<VerificationStatus>('PENDING_REVIEW');
  const { data, error, loading, reload } = useFocusData(() => api.adminClinicians(filter));

  // Reload when the filter changes (skip the first render — focus already loads).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void reload();
  }, [filter, reload]);

  return (
    <Screen>
      <Segmented<VerificationStatus>
        value={filter}
        onChange={setFilter}
        options={FILTERS.map((s) => ({ value: s, label: t(`admin.filters.${s}`) }))}
      />
      {loading && !data ? <Loading /> : null}
      {error ? <ErrorText>{errorMessage(error, t)}</ErrorText> : null}
      {data && data.length === 0 ? <EmptyState icon="shield-checkmark-outline">{t('admin.emptyQueue')}</EmptyState> : null}
      {data?.map((c) => {
        const name =
          [c.user.firstName ?? c.firstName, c.user.lastName ?? c.lastName].filter(Boolean).join(' ') ||
          c.title;
        return (
          <Card key={c.id}>
            <Pressable
              onPress={() => router.push({ pathname: '/admin/clinician/[id]', params: { id: c.id } } as never)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            >
              <Avatar name={name} uri={c.photoUrl} size={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.name}>{name}</Text>
                <Body muted style={{ fontSize: 13 }}>
                  {formatPhone(c.user.phone)} · {c.licenseNumber}
                </Body>
                <Body muted style={{ fontSize: 12 }}>
                  {t('admin.submitted', { date: dateLabel(c.updatedAt, locale) })}
                </Body>
              </View>
              <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                <Pill tone={TONE[c.verificationStatus]} label={t(`admin.filters.${c.verificationStatus}`)} />
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </View>
            </Pressable>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
});
