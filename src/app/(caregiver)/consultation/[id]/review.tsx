import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Banner, Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { colors, spacing } from '@/theme';

export default function Review() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!rating) return;
    setLoading(true);
    try {
      await api.review(id, rating, comment.trim() || undefined);
      setDone(true);
      setTimeout(() => router.back(), 1200);
    } catch (e) {
      setError(errorMessage(e, t));
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button title={t('common.send')} icon="send" variant="pink" disabled={!rating || done} loading={loading} onPress={submit} />}>
      <Title style={{ fontSize: 22 }}>{t('consultation.review')}</Title>
      <View style={styles.hearts} accessibilityRole="adjustable" accessibilityValue={{ min: 1, max: 5, now: rating }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} accessibilityRole="button" accessibilityLabel={`${n}/5`} hitSlop={6}>
            <Ionicons name={n <= rating ? 'heart' : 'heart-outline'} size={44} color={colors.pinkDeep} />
          </Pressable>
        ))}
      </View>
      <Field label={t('consultation.reviewComment')} value={comment} onChangeText={setComment} multiline maxLength={1000} style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm }} />
      {done ? <Banner tone="success">{t('consultation.reviewThanks')}</Banner> : null}
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hearts: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
});
