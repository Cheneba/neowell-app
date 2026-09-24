import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LanguageSwitch } from '@/components/language-switch';
import { Logo } from '@/components/logo';
import { Body, Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { toE164 } from '@/lib/phone';
import { useSession } from '@/lib/session';
import { colors, spacing } from '@/theme';

export default function SignIn() {
  const { t } = useI18n();
  const { api } = useSession();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    const e164 = toE164(phone);
    if (!e164) return setError(t('auth.invalidPhone'));
    setError(undefined);
    setLoading(true);
    try {
      await api.requestOtp(e164);
      router.push({ pathname: '/verify', params: { phone: e164 } });
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button title={t('auth.sendCode')} onPress={sendCode} loading={loading} icon="chatbubble-ellipses" />}>
      <View style={styles.top}>
        <LanguageSwitch />
      </View>
      <View style={styles.hero}>
        <Logo width={280} />
        <Body muted style={{ textAlign: 'center' }}>{t('auth.welcome')}</Body>
      </View>
      <View style={styles.heart} />
      <Title style={{ fontSize: 22 }}>{t('auth.phoneLabel')}</Title>
      <Field
        value={phone}
        onChangeText={setPhone}
        placeholder="6 70 00 00 00"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        hint={t('auth.phoneHint')}
        onSubmitEditing={sendCode}
        accessibilityLabel={t('auth.phoneLabel')}
      />
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'flex-end' },
  hero: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  heart: { height: 4, width: 48, borderRadius: 2, backgroundColor: colors.pink, alignSelf: 'center' },
});
