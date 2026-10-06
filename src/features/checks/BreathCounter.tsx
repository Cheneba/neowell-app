import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Title } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, fonts, spacing } from '@/theme';

const SECONDS = 60;

/** Guided 60-second breath count: tap once per breath (FR-CHK-05). */
export function BreathCounter({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone: (rate: number) => void }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'ready' | 'counting' | 'done'>('ready');
  const [left, setLeft] = useState(SECONDS);
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const start = () => {
    setCount(0);
    setLeft(SECONDS);
    setPhase('counting');
    const startedAt = Date.now();
    timer.current = setInterval(() => {
      const remaining = SECONDS - Math.floor((Date.now() - startedAt) / 1000);
      if (remaining <= 0) {
        if (timer.current) clearInterval(timer.current);
        setLeft(0);
        setPhase('done');
      } else setLeft(remaining);
    }, 250);
  };

  const close = () => {
    if (timer.current) clearInterval(timer.current);
    setPhase('ready');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.screen}>
        <Title>{t('check.breathTitle')}</Title>
        <Body muted>{t('check.breathHow')}</Body>
        <View style={styles.center}>
          {phase === 'counting' ? (
            <>
              <Text style={styles.left} accessibilityLiveRegion="polite">{t('check.breathLeft', { s: left })}</Text>
              <Pressable onPress={() => setCount((c) => c + 1)} style={({ pressed }) => [styles.tap, pressed && { transform: [{ scale: 0.96 }] }]} accessibilityRole="button" accessibilityLabel={t('check.breathTap')}>
                <Text style={styles.count}>{count}</Text>
                <Text style={styles.tapText}>{t('check.breathTap')}</Text>
              </Pressable>
            </>
          ) : phase === 'done' ? (
            <Text style={styles.result}>{t('check.breathResult', { n: count })}</Text>
          ) : null}
        </View>
        <View style={{ gap: spacing.sm }}>
          {phase === 'ready' ? <Button title={t('check.breathStart')} icon="play" onPress={start} /> : null}
          {phase === 'done' ? (
            <>
              <Button title={t('check.breathUse')} icon="checkmark" onPress={() => { setPhase('ready'); onDone(count); }} />
              <Button title={t('check.breathAgain')} variant="outline" onPress={start} />
            </>
          ) : null}
          <Button title={t('common.close')} variant="ghost" onPress={close} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.md, gap: spacing.md, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  left: { fontFamily: fonts.bold, fontSize: 20, color: colors.pinkDeep },
  tap: { width: 240, height: 240, borderRadius: 120, backgroundColor: colors.blueDeep, alignItems: 'center', justifyContent: 'center', borderWidth: 10, borderColor: colors.blueSoft },
  count: { fontFamily: fonts.extrabold, fontSize: 72, color: colors.white },
  tapText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white, textAlign: 'center', paddingHorizontal: spacing.md },
  result: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.blueDeep, textAlign: 'center' },
});
