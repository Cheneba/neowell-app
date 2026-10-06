import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ApiError } from '@/api/client';
import { Body, Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { formatPhone } from '@/lib/phone';
import { useSession } from '@/lib/session';

export default function Verify() {
  const { t } = useI18n();
  const { phone, role } = useLocalSearchParams<{ phone: string; role?: string }>();
  const { signIn, api } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  async function verify() {
    if (!/^\d{6}$/.test(code)) return setError(t('auth.wrongCode'));
    setError(undefined);
    setLoading(true);
    try {
      await signIn(phone, code, role === 'CLINICIAN' ? 'CLINICIAN' : 'CAREGIVER');
      // The root navigator switches to the signed-in screens automatically.
    } catch (e) {
      setError(e instanceof ApiError && e.status === 401 ? t('auth.wrongCode') : errorMessage(e, t));
      setLoading(false);
    }
  }

  async function resend() {
    setError(undefined);
    try {
      await api.requestOtp(phone);
      setResent(true);
    } catch (e) {
      setError(errorMessage(e, t));
    }
  }

  return (
    <Screen
      footer={
        <>
          <Button title={t('auth.verify')} onPress={verify} loading={loading} icon="lock-open" />
          <Button title={t('auth.changeNumber')} variant="ghost" onPress={() => router.back()} />
        </>
      }
    >
      <Title>{t('auth.codeTitle')}</Title>
      <Body muted>{t('auth.codeSentTo', { phone: formatPhone(phone ?? '') })}</Body>
      <Field
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        onSubmitEditing={verify}
        style={{ fontSize: 28, letterSpacing: 8, textAlign: 'center' }}
        accessibilityLabel={t('auth.codeTitle')}
      />
      <ErrorText>{error}</ErrorText>
      <Button title={t('auth.resend')} variant="outline" onPress={resend} disabled={resent} icon="refresh" />
    </Screen>
  );
}
