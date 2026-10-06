import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import type { Referral } from '@/api/types';
import { Button, ChoiceGroup, ErrorText, Field, Screen } from '@/components/ui';
import { FacilityPicker } from '@/features/babies/FacilityPicker';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { spacing } from '@/theme';

type Urgency = Referral['urgency'];

export default function Refer() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const [facilityId, setFacilityId] = useState<string>();
  const [facilityName, setFacilityName] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('SAME_DAY');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!facilityName.trim() || !reason.trim()) return setError(t('baby.required'));
    setLoading(true);
    try {
      await api.refer(id, { facilityId, facilityName: facilityId ? undefined : facilityName.trim(), urgency, reason: reason.trim() });
      router.back();
    } catch (e) {
      setError(errorMessage(e, t));
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button title={t('clinic.sendReferral')} icon="send" variant="danger" loading={loading} onPress={send} />}>
      <FacilityPicker
        label={t('clinic.referTitle')}
        selectedId={facilityId}
        name={facilityName}
        onChange={(fid, name) => {
          setFacilityId(fid);
          setFacilityName(name);
        }}
      />
      <ChoiceGroup<Urgency>
        label={t('clinic.urgency')}
        icon="alert-circle-outline"
        value={urgency}
        onChange={setUrgency}
        danger={['EMERGENCY']}
        options={(['EMERGENCY', 'SAME_DAY', 'ROUTINE'] as const).map((u) => ({ value: u, label: t(`consultation.urgency.${u}`) }))}
      />
      <Field label={t('clinic.reason')} value={reason} onChangeText={setReason} multiline maxLength={1000} style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm }} />
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}
