import { useState } from 'react';
import { Banner, Body, Button, CheckRow, ErrorText, Screen, Title } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { spacing } from '@/theme';

export default function Consent() {
  const { t } = useI18n();
  const { api, setMe } = useSession();
  const [dataCollection, setDataCollection] = useState(false);
  const [clinicianShare, setClinicianShare] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function accept() {
    if (!dataCollection) return setError(t('consent.required'));
    setLoading(true);
    try {
      setMe(await api.updateConsents({ dataCollection: true, clinicianShare }));
    } catch (e) {
      setError(errorMessage(e, t));
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button title={t('consent.accept')} onPress={accept} loading={loading} icon="heart" variant="pink" />}>
      <Title style={{ marginTop: spacing.xl }}>{t('consent.title')}</Title>
      <Body>{t('consent.intro')}</Body>
      <CheckRow checked={dataCollection} onToggle={() => setDataCollection((v) => !v)} label={t('consent.dataCollection')} />
      <CheckRow checked={clinicianShare} onToggle={() => setClinicianShare((v) => !v)} label={t('consent.clinicianShare')} />
      <Banner tone="pink">{t('consent.disclaimer')}</Banner>
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}
