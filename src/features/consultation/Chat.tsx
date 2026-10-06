import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Message } from '@/api/types';
import { useI18n } from '@/i18n';
import { clockLabel } from '@/lib/format';
import { pickImage } from '@/lib/pick';
import { useSession } from '@/lib/session';
import { colors, fonts, radius, spacing } from '@/theme';
import { mergeMessages } from './messages';

const POLL_MS = 5000;

/** Chat thread with 5-second polling while the screen is focused (design guide §7). */
export function Chat({ consultationId, open, closedText, onActivity }: { consultationId: string; open: boolean; closedText: string; onActivity?: () => void }) {
  const { t, locale } = useI18n();
  const { api } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const lastId = useRef<string | undefined>(undefined);

  const fetchNew = useCallback(async () => {
    try {
      const incoming = await api.messages(consultationId, lastId.current);
      if (!incoming.length) return;
      setMessages((cur) => {
        const merged = mergeMessages(cur, incoming);
        lastId.current = merged[merged.length - 1]?.id;
        return merged;
      });
      const newest = incoming[incoming.length - 1];
      if (!newest.mine) void api.markMessagesRead(consultationId, newest.id).catch(() => undefined);
      if (incoming.some((m) => m.kind === 'SYSTEM')) onActivity?.();
    } catch {
      // offline: try again on the next tick
    }
  }, [api, consultationId, onActivity]);

  useFocusEffect(
    useCallback(() => {
      void fetchNew();
      const timer = setInterval(fetchNew, POLL_MS);
      return () => clearInterval(timer);
    }, [fetchNew]),
  );

  async function send() {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const m = await api.sendMessage(consultationId, body);
      setText('');
      setMessages((cur) => mergeMessages(cur, [m]));
      lastId.current = m.id;
    } finally {
      setSending(false);
    }
  }

  async function sendPhoto() {
    const file = await pickImage('gallery');
    if (!file) return;
    setSending(true);
    try {
      const m = await api.sendImage(consultationId, file);
      setMessages((cur) => mergeMessages(cur, [m]));
      lastId.current = m.id;
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {messages.map((m) => (
        <Bubble key={m.id} m={m} time={clockLabel(m.createdAt, locale)} />
      ))}
      {open ? (
        <View style={styles.composer}>
          <Pressable onPress={sendPhoto} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={t('clinic.gallery')} disabled={sending}>
            <Ionicons name="image-outline" size={24} color={colors.blueDeep} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('consultation.composer')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
            maxLength={2000}
            accessibilityLabel={t('consultation.composer')}
          />
          <Pressable onPress={send} style={[styles.iconButton, styles.send]} accessibilityRole="button" accessibilityLabel={t('common.send')} disabled={sending || !text.trim()}>
            <Ionicons name="send" size={20} color={colors.white} />
          </Pressable>
        </View>
      ) : (
        <Text style={styles.closed}>{closedText}</Text>
      )}
    </View>
  );
}

function Bubble({ m, time }: { m: Message; time: string }) {
  const { t } = useI18n();
  if (m.kind === 'SYSTEM') return <Text style={styles.system}>{t(`consultation.system.${m.body}`)} · {time}</Text>;
  if (m.kind === 'REPORT') {
    return (
      <View style={styles.report}>
        <Ionicons name="document-text" size={20} color={colors.blueDeep} />
        <Text style={styles.reportText}>{t('consultation.report')}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.bubble, m.mine ? styles.mine : styles.theirs]}>
      {m.imageUrl ? <Image source={{ uri: m.imageUrl }} style={styles.image} contentFit="cover" /> : null}
      {m.body ? <Text style={[styles.text, m.mine && { color: colors.white }]}>{m.body}</Text> : null}
      {m.contactMasked ? <Text style={[styles.meta, m.mine && { color: colors.blueSoft }]}>{t('consultation.masked')}</Text> : null}
      <Text style={[styles.meta, m.mine && { color: colors.blueSoft }]}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '85%', padding: spacing.sm + 2, borderRadius: radius.md, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.blueDeep, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.pinkSoft, borderBottomLeftRadius: 4 },
  text: { fontFamily: fonts.regular, fontSize: 16, color: colors.ink, lineHeight: 22 },
  meta: { fontFamily: fonts.semibold, fontSize: 11, color: colors.muted, alignSelf: 'flex-end' },
  image: { width: 200, height: 200, borderRadius: radius.sm },
  system: { alignSelf: 'center', fontFamily: fonts.semibold, fontSize: 13, color: colors.muted, textAlign: 'center' },
  report: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', backgroundColor: colors.blueSoft, padding: spacing.sm + 2, borderRadius: radius.md },
  reportText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.blueDeep },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, backgroundColor: colors.white },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  send: { backgroundColor: colors.blueDeep },
  closed: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted, textAlign: 'center' },
});
