import { useState } from 'react';
import { View } from 'react-native';
import { LanguageSwitch } from '@/components/language-switch';
import { Banner, Body, Button, ErrorText, Field, Label, Screen, Title } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { spacing } from '@/theme';

/** First and last name for every role (FR-ACC-01): the baby is called "Baby {last name}" for 42 days. */
export default function Profile() {
  const { t, locale } = useI18n();
  const { api, me, setMe } = useSession();
  const [firstName, setFirstName] = useState(me?.firstName ?? '');
  const [lastName, setLastName] = useState(me?.lastName ?? '');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const caregiver = me?.role !== 'CLINICIAN';

  async function save() {
    if (!firstName.trim() || !lastName.trim()) return setError(t('profile.required'));
    setError(undefined);
    setLoading(true);
    try {
      setMe(await api.updateMe({ firstName: firstName.trim(), lastName: lastName.trim(), locale }));
    } catch (e) {
      setError(errorMessage(e, t));
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button title={t('common.continue')} onPress={save} loading={loading} icon="arrow-forward" />}>
      <Title style={{ marginTop: spacing.xl }}>{t('profile.title')}</Title>
      {caregiver ? <Body muted>{t('profile.intro')}</Body> : null}
      <Field label={t('profile.firstName')} value={firstName} onChangeText={setFirstName} autoCapitalize="words" autoComplete="given-name" maxLength={60} />
      <Field label={t('profile.lastName')} value={lastName} onChangeText={setLastName} autoCapitalize="words" autoComplete="family-name" maxLength={60} />
      {caregiver && lastName.trim() ? (
        <Banner tone="pink" icon="heart">{t('profile.namingNote', { lastName: lastName.trim() })}</Banner>
      ) : null}
      <View style={{ gap: spacing.xs }}>
        <Label>{t('profile.language')}</Label>
        <View style={{ alignSelf: 'flex-start' }}>
          <LanguageSwitch />
        </View>
      </View>
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}
