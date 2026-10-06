import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { RiskBadge } from '@/components/risk-badge';
import { Banner, Body, Button, Card, type IconName, Screen, Title } from '@/components/ui';
import { bookingContext, hasFever } from '@/features/consultation/booking-context';
import { useI18n } from '@/i18n';
import { clockLabel } from '@/lib/format';
import { lastResult } from '@/lib/last-result';
import { colors, fonts, riskStyle, spacing } from '@/theme';

/** Actions that become buttons or cards rather than advice lines. */
const UI_ACTIONS = new Set(['SHOW_EMERGENCY_NUMBERS', 'SHOW_NEAREST_FACILITIES', 'RECHECK_TEMP_30_MIN', 'CONSIDER_TELECONSULT']);

export default function Result() {
  const { t, locale } = useI18n();
  const result = lastResult.get();
  if (!result) return <Redirect href="/" />;

  const { assessment, babyName, recheck, observation } = result;
  const level = assessment.level;
  const s = riskStyle[level];
  const advice = assessment.actions.filter((a) => !UI_ACTIONS.has(a));
  const isRed = level === 'RED';
  const showSeizure =
    assessment.findings.some((f) => f.code === 'CONVULSIONS') || observation.complaints.includes('TWITCHING_OR_FITS');

  const talkToDoctor = () => {
    bookingContext.set({ babyId: result.babyId, observationId: result.queued ? undefined : observation.id, fever: hasFever(assessment.findings) });
    router.dismissTo('/doctors');
  };

  return (
    <Screen
      footer={
        <>
          {level !== 'GREEN' ? (
            <Button title={t('result.findFacility')} icon="location" variant={isRed ? 'danger' : 'primary'} onPress={() => router.push('/facilities')} />
          ) : null}
          {level !== 'GREEN' && !result.queued ? <Button title={t('result.talkToDoctor')} icon="chatbubbles" variant="pink" onPress={talkToDoctor} /> : null}
          <Button title={t('result.done')} variant={level === 'GREEN' ? 'primary' : 'ghost'} onPress={() => router.dismissTo('/')} />
        </>
      }
    >
      {result.queued ? <Banner tone="warning" icon="cloud-offline">{t('check.offlineSaved')}</Banner> : null}
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
              <Ionicons name={f.level === 'RED' ? 'warning' : 'alert-circle'} size={20} color={f.level === 'RED' ? colors.red : colors.yellow} />
              <Body style={{ flex: 1 }}>{t(`findings.${f.code}`)}</Body>
            </View>
          ))}
        </Card>
      ) : null}

      <Card tint={colors.blueSoft}>
        <Title style={styles.h2}>{t('result.whatToDo')}</Title>
        {advice.map((a) => (
          <View key={a} style={styles.item}>
            <Ionicons name={a === 'NO_HOME_MEDICINES' ? 'close-circle' : 'heart'} size={18} color={a === 'NO_HOME_MEDICINES' ? colors.red : colors.pink} style={{ marginTop: 3 }} />
            <Body style={{ flex: 1, fontFamily: a === 'SEEK_CARE_NOW' || a === 'NO_HOME_MEDICINES' ? fonts.extrabold : fonts.regular }}>{t(`actions.${a}`)}</Body>
          </View>
        ))}
      </Card>

      {recheck ? (
        <Card tint={colors.yellowSoft}>
          <View style={styles.item}>
            <Ionicons name="alarm" size={22} color={colors.yellow} />
            <Title style={[styles.h2, { flex: 1 }]}>{t('result.recheckTitle')}</Title>
          </View>
          <Body>{t('result.recheckBody', { time: clockLabel(recheck.dueAt, locale) })}</Body>
        </Card>
      ) : null}

      {showSeizure ? (
        <Card tint={colors.redSoft}>
          <Title style={[styles.h2, { color: colors.red }]}>{t('result.seizureTitle')}</Title>
          <Body>{t('result.seizureBody')}</Body>
        </Card>
      ) : null}

      {isRed && assessment.emergencyNumbers.length ? (
        <Card tint={colors.redSoft}>
          <Title style={[styles.h2, { color: colors.red }]}>{t('result.emergency')}</Title>
          {assessment.emergencyNumbers.map((n) => (
            <Button key={n} title={`${t('common.call')} ${n}`} icon="call" variant="danger" onPress={() => Linking.openURL(`tel:${n}`)} />
          ))}
        </Card>
      ) : null}

      <Body muted style={{ fontSize: 13, textAlign: 'center', marginTop: spacing.sm }}>{t('result.disclaimer')}</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: 28 },
  light: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: colors.white },
  babyName: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  h2: { fontSize: 19 },
  item: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
