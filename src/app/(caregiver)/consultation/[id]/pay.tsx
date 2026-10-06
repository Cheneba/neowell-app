import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { Consultation } from '@/api/types';
import { Banner, Body, Button, Card, ChoiceGroup, ErrorText, Field, Loading, Screen, Title } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { money } from '@/lib/format';
import { formatPhone, toE164 } from '@/lib/phone';
import { useSession } from '@/lib/session';
import { colors, fonts, spacing } from '@/theme';

type Provider = 'MTN_MOMO' | 'ORANGE_MONEY';
const POLL_MS = 3000;
const POLL_LIMIT_MS = 2 * 60 * 1000;

/** Mobile money payment: the payer approves a prompt on their phone, we poll until it settles. */
export default function Pay() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, me } = useSession();
  const [c, setC] = useState<Consultation>();
  const [provider, setProvider] = useState<Provider>('MTN_MOMO');
  const [phone, setPhone] = useState(me?.phone ? formatPhone(me.phone).replace('+237 ', '') : '');
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.consultation(id).then(setC, (e) => setError(errorMessage(e, t)));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [api, id, t]);

  function poll(startedAt: number) {
    timer.current = setTimeout(async () => {
      try {
        const next = await api.consultation(id);
        setC(next);
        if (next.paymentStatus === 'PAID') return router.replace({ pathname: '/consultation/[id]', params: { id } });
        if (next.paymentStatus === 'FAILED') {
          setWaiting(false);
          return setError(t('pay.failed'));
        }
      } catch {
        // keep polling through brief network loss
      }
      if (Date.now() - startedAt < POLL_LIMIT_MS) poll(startedAt);
      else {
        setWaiting(false);
        setError(t('pay.failed'));
      }
    }, POLL_MS);
  }

  async function pay() {
    const e164 = toE164(phone);
    if (!e164) return setError(t('auth.invalidPhone'));
    setError(undefined);
    setWaiting(true);
    try {
      await api.pay(id, provider, e164);
      poll(Date.now());
    } catch (e) {
      setWaiting(false);
      setError(errorMessage(e, t));
    }
  }

  if (!c) return error ? <Screen><ErrorText>{error}</ErrorText></Screen> : <Loading />;

  return (
    <Screen footer={waiting ? null : <Button title={t('pay.payNow', { amount: money(c.feeXaf) })} icon="lock-closed" variant="pink" onPress={pay} />}>
      <Card tint={colors.pinkSoft} style={{ alignItems: 'center' }}>
        <Body muted>{t('pay.amount')}</Body>
        <Text style={styles.amount}>{money(c.feeXaf)}</Text>
        <Body muted style={{ fontSize: 14 }}>{c.clinician.displayName} · {t(`doctors.media.${c.medium}`)}</Body>
      </Card>
      {waiting ? (
        <View style={styles.waiting}>
          <ActivityIndicator size="large" color={colors.pinkDeep} />
          <Title style={{ fontSize: 20, textAlign: 'center' }}>{t('pay.waiting')}</Title>
          <Body muted style={{ textAlign: 'center' }}>{t('pay.waitingHint', { provider: t(`pay.${provider}`) })}</Body>
        </View>
      ) : (
        <>
          <ChoiceGroup<Provider>
            label={t('pay.provider')}
            icon="wallet-outline"
            value={provider}
            onChange={setProvider}
            options={(['MTN_MOMO', 'ORANGE_MONEY'] as const).map((p) => ({ value: p, label: t(`pay.${p}`) }))}
          />
          <Field label={t('pay.payerPhone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="6 70 00 00 00" />
          <Banner tone="info" icon="shield-checkmark">{t('doctors.privacy')}</Banner>
        </>
      )}
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  amount: { fontFamily: fonts.extrabold, fontSize: 34, color: colors.pinkDeep },
  waiting: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
});
