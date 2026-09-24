import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ObservationInput } from '@/api/types';
import { Body, Button, Card, ChoiceGroup, ErrorText, type IconName, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { lastResult } from '@/lib/last-result';
import { parseTemperature } from '@/lib/temperature';
import { useSession } from '@/lib/session';
import { colors, fonts, radius, spacing } from '@/theme';

type Answers = Omit<ObservationInput, 'temperatureC' | 'feedingCount24h' | 'convulsions' | 'notes'> & {
  convulsions?: 'no' | 'yes';
};

/** One question of the checklist: API field, icon, options in display order, and danger options. */
const QUESTIONS: {
  field: keyof Answers;
  section: string;
  icon: IconName;
  options: string[];
  danger: string[];
}[] = [
  { field: 'feedingQuality', section: 'feeding', icon: 'water-outline', options: ['GOOD', 'REDUCED', 'UNABLE'], danger: ['UNABLE'] },
  { field: 'breathing', section: 'breathing', icon: 'pulse-outline', options: ['NORMAL', 'FAST', 'DIFFICULT'], danger: ['FAST', 'DIFFICULT'] },
  { field: 'activity', section: 'activity', icon: 'body-outline', options: ['NORMAL', 'REDUCED', 'LETHARGIC'], danger: ['LETHARGIC'] },
  { field: 'skinColor', section: 'skin', icon: 'color-palette-outline', options: ['NORMAL', 'PALE', 'YELLOW', 'MOTTLED', 'BLUE'], danger: ['BLUE'] },
  { field: 'jaundice', section: 'jaundice', icon: 'eye-outline', options: ['NONE', 'FACE_CHEST', 'PALMS_SOLES'], danger: ['PALMS_SOLES'] },
  { field: 'cry', section: 'cry', icon: 'volume-medium-outline', options: ['NORMAL', 'WEAK', 'INCONSOLABLE', 'HIGH_PITCHED'], danger: ['HIGH_PITCHED'] },
  { field: 'stoolPattern', section: 'stool', icon: 'ellipse-outline', options: ['NORMAL', 'REDUCED', 'NONE', 'DIARRHEA', 'BLOODY'], danger: ['BLOODY'] },
  { field: 'cordStatus', section: 'cord', icon: 'bandage-outline', options: ['NORMAL', 'RED_OR_DISCHARGE', 'SPREADING_REDNESS_OR_PUS'], danger: ['SPREADING_REDNESS_OR_PUS'] },
  { field: 'convulsions', section: 'convulsions', icon: 'flash-outline', options: ['no', 'yes'], danger: ['yes'] },
];

export default function DailyCheck() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { api } = useSession();
  const [temp, setTemp] = useState('36.8');
  const [feeds, setFeeds] = useState(8);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const stepTemp = (delta: number) => {
    const current = parseTemperature(temp) ?? 36.8;
    setTemp((Math.round((current + delta) * 10) / 10).toFixed(1));
  };

  async function submit() {
    const temperatureC = parseTemperature(temp);
    if (temperatureC == null) return setError(t('check.temperatureInvalid'));
    setError(undefined);
    setLoading(true);
    try {
      const { convulsions, ...rest } = answers;
      const [{ assessment }, baby] = await Promise.all([
        api.createObservation(id, {
          ...rest,
          temperatureC,
          feedingCount24h: feeds,
          convulsions: convulsions === 'yes',
        }),
        api.baby(id),
      ]);
      lastResult.set({ babyId: id, babyName: baby.name, assessment });
      router.replace('/result');
    } catch (e) {
      setError(errorMessage(e, t));
      setLoading(false);
    }
  }

  const tempValue = parseTemperature(temp);

  return (
    <Screen footer={<><ErrorText>{error}</ErrorText><Button title={t('check.submit')} onPress={submit} loading={loading} icon="arrow-forward-circle" /></>}>
      {/* Temperature — the key measurement, so it gets the biggest control. */}
      <Card tint={colors.blueSoft} style={{ alignItems: 'center' }}>
        <View style={styles.row}>
          <Ionicons name="thermometer" size={24} color={colors.blueDeep} />
          <Text style={styles.sectionTitle}>{t('check.temperature')}</Text>
        </View>
        <View style={styles.stepper}>
          <StepButton icon="remove" onPress={() => stepTemp(-0.1)} label="-0.1" />
          <View style={styles.tempBox}>
            <TextInput
              value={temp}
              onChangeText={setTemp}
              keyboardType="decimal-pad"
              style={[styles.tempInput, tempValue == null && { color: colors.red }]}
              maxLength={4}
              accessibilityLabel={t('check.temperature')}
            />
            <Text style={styles.unit}>°C</Text>
          </View>
          <StepButton icon="add" onPress={() => stepTemp(0.1)} label="+0.1" />
        </View>
        <Body muted style={{ fontSize: 14, textAlign: 'center' }}>{t('check.temperatureHint')}</Body>
      </Card>

      <Card>
        <View style={styles.row}>
          <Ionicons name="nutrition-outline" size={22} color={colors.blueDeep} />
          <Text style={[styles.sectionTitle, { flex: 1, fontSize: 17 }]}>{t('check.feedsLabel')}</Text>
        </View>
        <View style={[styles.stepper, { alignSelf: 'center' }]}>
          <StepButton icon="remove" onPress={() => setFeeds((f) => Math.max(0, f - 1))} label="-1" />
          <Text style={styles.feeds} accessibilityLiveRegion="polite">{feeds}</Text>
          <StepButton icon="add" onPress={() => setFeeds((f) => Math.min(30, f + 1))} label="+1" />
        </View>
      </Card>

      {QUESTIONS.map((q) => (
        <Card key={q.field}>
          <ChoiceGroup
            label={t(`check.sections.${q.section}`)}
            icon={q.icon}
            value={answers[q.field] as string | undefined}
            danger={q.danger}
            onChange={(v) => setAnswers((a) => ({ ...a, [q.field]: v }))}
            options={q.options.map((o) => ({ value: o, label: t(`check.options.${q.field}.${o}`) }))}
          />
        </Card>
      ))}
    </Screen>
  );
}

function StepButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={styles.stepButton} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={28} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 19, color: colors.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.blueDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.blue,
  },
  tempInput: {
    fontFamily: fonts.extrabold,
    fontSize: 44,
    color: colors.ink,
    width: 104,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  unit: { fontFamily: fonts.bold, fontSize: 22, color: colors.muted },
  feeds: { fontFamily: fonts.extrabold, fontSize: 36, color: colors.ink, minWidth: 56, textAlign: 'center' },
});
