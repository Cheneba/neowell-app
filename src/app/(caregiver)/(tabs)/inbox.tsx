import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppNotification } from '@/api/types';
import { Body, Button, EmptyState, ErrorText, Loading, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { timeLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, radius, spacing } from '@/theme';

export default function Inbox() {
  const { t } = useI18n();
  const { api } = useSession();
  const { data, error, loading, reload } = useFocusData(() => api.notifications());

  async function open(n: AppNotification) {
    if (!n.readAt) void api.markNotificationsRead({ ids: [n.id] }).catch(() => undefined);
    if (n.data?.url) router.push(n.data.url as never);
    else void reload();
  }

  if (loading && !data) return <Loading />;
  return (
    <Screen>
      {error ? <ErrorText>{errorMessage(error, t)}</ErrorText> : null}
      {data?.unreadCount ? (
        <Button title={t('inbox.markAll')} variant="ghost" icon="checkmark-done" onPress={async () => { await api.markNotificationsRead({ all: true }).catch(() => undefined); void reload(); }} />
      ) : null}
      {data && data.items.length === 0 ? <EmptyState icon="notifications-outline">{t('inbox.empty')}</EmptyState> : null}
      {data?.items.map((n) => <Row key={n.id} n={n} onPress={() => open(n)} />)}
    </Screen>
  );
}

function Row({ n, onPress }: { n: AppNotification; onPress: () => void }) {
  const { locale } = useI18n();
  const unread = !n.readAt;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, unread && styles.unread, pressed && { opacity: 0.8 }]}>
      <Ionicons name={unread ? 'ellipse' : 'ellipse-outline'} size={12} color={unread ? colors.pinkDeep : colors.border} style={{ marginTop: 6 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.title, unread && { fontFamily: fonts.extrabold }]}>{n.title}</Text>
        <Body style={{ fontSize: 15 }}>{n.body}</Body>
        <Body muted style={{ fontSize: 12 }}>{timeLabel(n.createdAt, locale)}</Body>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  unread: { backgroundColor: colors.blueSoft, borderColor: colors.blueSoft },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
});
