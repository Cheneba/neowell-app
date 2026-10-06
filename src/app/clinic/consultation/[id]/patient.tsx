import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { RiskBadge } from '@/components/risk-badge';
import { Avatar, Banner, Body, Card, ErrorText, Loading, Pill, Screen, Title } from '@/components/ui';
import { GrowthRow } from '@/features/growth/GrowthRow';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { babyName, fullAgeLabel, timeLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

/** 7-day summary of the baby for the clinician (FR-CONS-05). */
export default function Patient() {
  const { t, locale } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const { data: s, error, loading } = useFocusData(() => api.consultationSummary(id));
  if (loading && !s) return <Loading />;
  if (!s) return <Screen><ErrorText>{errorMessage(error, t)}</ErrorText></Screen>;
  const name = babyName(s.baby.displayName, locale);

  return (
    <Screen>
      <View style={styles.hero}>
        <Avatar name={name} size={72} />
        <Title style={{ fontSize: 22 }}>{name}</Title>
        <Body muted>{fullAgeLabel(s.baby, t)}</Body>
        {s.baby.sex ? <Pill label={t(`baby.${s.baby.sex}`)} /> : null}
        {s.baby.termStatus ? <Pill tone="pink" label={t(`termStatus.${s.baby.termStatus}`)} /> : null}
      </View>
      {s.baby.riskFactors.length ? (
        <Banner tone="pink" icon="heart">{s.baby.riskFactors.map((r) => t(`riskFactors.${r.code}`)).join(' · ')}</Banner>
      ) : null}

      <Card>
        <Text style={styles.h2}>{t('growth.title')}</Text>
        <GrowthRow label={t('growth.weight')} item={s.growth.latest.weight} />
        <GrowthRow label={t('growth.length')} item={s.growth.latest.length} />
        <GrowthRow label={t('growth.headCircumference')} item={s.growth.latest.headCircumference} />
      </Card>

      <Card>
        <Text style={styles.h2}>{t('clinic.checksSummary', { checks: s.totals.checks, red: s.totals.red, yellow: s.totals.yellow })}</Text>
        {s.temperature ? <Body>{t('clinic.tempRange', { min: s.temperature.min, max: s.temperature.max })}</Body> : null}
        {Object.entries(s.findingCounts).map(([code, n]) => (
          <Body key={code} style={{ fontSize: 15 }}>• {t(`findings.${code}`)} × {n}</Body>
        ))}
      </Card>

      {s.observations.map((o) => (
        <Card key={o.id} style={{ gap: 4 }}>
          <View style={styles.row}>
            <Text style={styles.date}>{timeLabel(o.observedAt, locale)}</Text>
            <RiskBadge level={o.riskLevel} />
          </View>
          <Body style={{ fontSize: 15 }}>
            {[o.temperatureC != null ? `${o.temperatureC} °C` : null, o.respiratoryRate != null ? `${o.respiratoryRate}/min` : null, ...o.complaints.map((c) => t(`check.complaints.${c}`))]
              .filter(Boolean)
              .join(' · ')}
          </Body>
          {o.findings.length ? <Body muted style={{ fontSize: 14 }}>{o.findings.map((f) => t(`findings.${f}`)).join(', ')}</Body> : null}
          {o.notes ? <Body muted style={{ fontSize: 14 }}>“{o.notes}”</Body> : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs },
  h2: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  date: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
});
