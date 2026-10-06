import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { PlanQuestion } from '@/api/types';
import { Body, Button, Card, ChoiceGroup, type IconName } from '@/components/ui';
import { useI18n } from '@/i18n';
import { parseTemperature } from '@/lib/temperature';
import { colors, fonts, radius, spacing } from '@/theme';
import { BreathCounter } from './BreathCounter';

const ICONS: Record<string, IconName> = {
  temperatureC: 'thermometer',
  roomFeel: 'home-outline',
  clothing: 'shirt-outline',
  feedingQuality: 'water-outline',
  feedingCount24h: 'nutrition-outline',
  breathing: 'pulse-outline',
  respiratoryRate: 'pulse',
  chestIndrawing: 'body-outline',
  breathingSound: 'volume-high-outline',
  activity: 'walk-outline',
  convulsions: 'flash-outline',
  skinColor: 'color-palette-outline',
  jaundice: 'eye-outline',
  cry: 'volume-medium-outline',
  stoolPattern: 'ellipse-outline',
  cordStatus: 'bandage-outline',
  vomiting: 'water',
};

type Value = string | number | boolean | undefined;

/** Renders one check-plan question by kind (design guide §4). */
export function QuestionRenderer({ q, value, onChange }: { q: PlanQuestion; value: Value; onChange: (v: Value) => void }) {
  const icon = ICONS[q.field] ?? 'help-circle-outline';
  if (q.kind === 'TEMPERATURE') return <TemperatureCard q={q} value={value} onChange={onChange} />;
  if (q.kind === 'COUNTER') return <CounterCard q={q} icon={icon} value={typeof value === 'number' ? value : (q.defaultValue ?? 0)} onChange={onChange} />;
  if (q.kind === 'BREATH_COUNTER') return <BreathCard q={q} value={typeof value === 'number' ? value : undefined} onChange={onChange} />;
  const options = q.options ?? [];
  return (
    <Card>
      <ChoiceGroup
        label={q.label}
        icon={icon}
        value={value === undefined ? undefined : String(value)}
        danger={options.filter((o) => o.danger).map((o) => o.value)}
        onChange={(v) => onChange(v)}
        options={options.map((o) => ({ value: o.value, label: o.label }))}
      />
      {q.help ? <Hint text={q.help} /> : null}
    </Card>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <View style={styles.hint}>
      <Ionicons name="information-circle-outline" size={18} color={colors.blueDeep} />
      <Body muted style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{text}</Body>
    </View>
  );
}

function TemperatureCard({ q, value, onChange }: { q: PlanQuestion; value: Value; onChange: (v: Value) => void }) {
  const text = value === undefined ? '' : String(value);
  const parsed = parseTemperature(text);
  const step = (d: number) => onChange(Math.round(((parsed ?? q.defaultValue ?? 36.8) + d) * 10) / 10);
  return (
    <Card tint={colors.blueSoft} style={{ alignItems: 'center' }}>
      <View style={styles.row}>
        <Ionicons name="thermometer" size={24} color={colors.blueDeep} />
        <Text style={styles.title}>{q.label}</Text>
      </View>
      <View style={styles.stepper}>
        <StepButton icon="remove" label="-0.1" onPress={() => step(-0.1)} />
        <View style={styles.tempBox}>
          <TextInput
            value={typeof value === 'number' ? value.toFixed(1) : text}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            style={[styles.tempInput, parsed == null && { color: colors.red }]}
            maxLength={4}
            accessibilityLabel={q.label}
          />
          <Text style={styles.unit}>°C</Text>
        </View>
        <StepButton icon="add" label="+0.1" onPress={() => step(0.1)} />
      </View>
      {q.help ? <Body muted style={{ fontSize: 14, textAlign: 'center' }}>{q.help}</Body> : null}
    </Card>
  );
}

function CounterCard({ q, icon, value, onChange }: { q: PlanQuestion; icon: IconName; value: number; onChange: (v: Value) => void }) {
  const min = q.min ?? 0;
  const max = q.max ?? 99;
  return (
    <Card>
      <View style={styles.row}>
        <Ionicons name={icon} size={22} color={colors.blueDeep} />
        <Text style={[styles.title, { flex: 1, fontSize: 17 }]}>{q.label}</Text>
      </View>
      <View style={[styles.stepper, { alignSelf: 'center' }]}>
        <StepButton icon="remove" label="-1" onPress={() => onChange(Math.max(min, value - 1))} />
        <Text style={styles.count} accessibilityLiveRegion="polite">{value}</Text>
        <StepButton icon="add" label="+1" onPress={() => onChange(Math.min(max, value + 1))} />
      </View>
      {q.help ? <Hint text={q.help} /> : null}
    </Card>
  );
}

function BreathCard({ q, value, onChange }: { q: PlanQuestion; value?: number; onChange: (v: Value) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <View style={styles.row}>
        <Ionicons name="pulse" size={22} color={colors.blueDeep} />
        <Text style={[styles.title, { flex: 1, fontSize: 17 }]}>{q.label}</Text>
      </View>
      {value ? <Text style={styles.breathValue}>{t('check.breathResult', { n: value })}</Text> : null}
      {q.help ? <Hint text={q.help} /> : null}
      <Button title={value ? t('check.breathAgain') : t('check.breathCount')} variant="outline" icon="timer-outline" onPress={() => setOpen(true)} />
      <BreathCounter
        visible={open}
        onClose={() => setOpen(false)}
        onDone={(rate) => {
          onChange(rate);
          setOpen(false);
        }}
      />
    </Card>
  );
}

export function StepButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={styles.stepButton} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={28} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontFamily: fonts.bold, fontSize: 19, color: colors.ink },
  hint: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.blueDeep, alignItems: 'center', justifyContent: 'center' },
  tempBox: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 2, borderColor: colors.blue },
  tempInput: { fontFamily: fonts.extrabold, fontSize: 44, color: colors.ink, width: 104, textAlign: 'center', paddingVertical: spacing.xs },
  unit: { fontFamily: fonts.bold, fontSize: 22, color: colors.muted },
  count: { fontFamily: fonts.extrabold, fontSize: 36, color: colors.ink, minWidth: 56, textAlign: 'center' },
  breathValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.blueDeep },
});
