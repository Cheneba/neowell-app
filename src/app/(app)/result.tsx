import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { RiskBadge } from '@/components/risk-badge';
import { Body, Button, Card, type IconName, Screen, Title } from '@/components/ui';
import { useI18n } from '@/i18n';
import { lastResult } from '@/lib/last-result';
import { colors, fonts, riskStyle, spacing } from '@/theme';

/** Actions that trigger UI (buttons below) rather than being read as advice. */
const UI_ACTIONS = new Set(['SHOW_EMERGENCY_NUMBERS', 'SHOW_NEAREST_FACILITIES']);

export default function Result() {
  const { t } = useI18n();
  const result = lastResult.get();
  if (!result) return <Redirect href="/" />;

  const { assessment, babyName } = result;
  const level = assessment.level;
  const s = riskStyle[level];
  const advice = assessment.actions.filter((a) => !UI_ACTIONS.has(a));
  const isRed = level === 'RED';

  return (
    <Screen
      footer={
        <>
          {level !== 'GREEN' ? (
            <Button
              title={t('result.findFacility')}
              icon="location"
              variant={isRed ? 'danger' : 'primary'}
              onPress={() => router.push('/facilities')}
            />
          ) : null}
          <Button title={t('result.done')} variant={level === 'GREEN' ? 'primary' : 'ghost'} onPress={() => router.dismissTo('/')} />
        </>
      }
    >
      <View style={[styles.hero, { backgroundColor: s.bg }]}>
        <View style={[styles.light, { backgroundColor: s.dot }]}>
          <Ionicons name={s.icon as IconName} size={64} color={colors.white} />
        </View>
        <Text style={styles.babyName}>{babyName}</Text>
        <RiskBadge level={level} size="lg" />
        <Body style={{ textAlign: 'center', color: s.fg, fontFamily: fonts.semibold }}>{t(`result.${level}_sub`)}</Body>
      </View>

      {assessment.findings.length ? (
        <Card>
          <Title style={styles.h2}>{t('result.whatWeFound')}</Title>
          {assessment.findings.map((f) => (
            <View key={f.code} style={styles.item}>
              <Ionicons
                name={f.level === 'RED' ? 'warning' : 'alert-circle'}
                size={20}
                color={f.level === 'RED' ? colors.red : colors.yellow}
              />
              <Body style={{ flex: 1 }}>{t(`findings.${f.code}`)}</Body>
            </View>
          ))}
        </Card>
      ) : null}

      <Card tint={colors.blueSoft}>
        <Title style={styles.h2}>{t('result.whatToDo')}</Title>
        {advice.map((a) => (
          <View key={a} style={styles.item}>
            <Ionicons name="heart" size={18} color={colors.pink} style={{ marginTop: 3 }} />
            <Body style={{ flex: 1, fontFamily: a === 'SEEK_CARE_NOW' ? fonts.extrabold : fonts.regular }}>
              {t(`actions.${a}`)}
            </Body>
          </View>
        ))}
      </Card>

      {isRed && assessment.emergencyNumbers.length ? (
        <Card tint={colors.redSoft}>
          <Title style={[styles.h2, { color: colors.red }]}>{t('result.emergency')}</Title>
          {assessment.emergencyNumbers.map((n) => (
            <Button key={n} title={`${t('common.call')} ${n}`} icon="call" variant="danger" onPress={() => Linking.openURL(`tel:${n}`)} />
          ))}
        </Card>
      ) : null}

      <Body muted style={{ fontSize: 13, textAlign: 'center' }}>{t('result.disclaimer')}</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: 28 },
  light: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.white,
  },
  babyName: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  h2: { fontSize: 19 },
  item: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
