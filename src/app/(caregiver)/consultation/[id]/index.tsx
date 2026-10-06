import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button, ErrorText, Loading, Screen } from '@/components/ui';
import { ConsultationRoom } from '@/features/consultation/ConsultationRoom';
import { refundOnCancel } from '@/features/consultation/status';
import { useI18n } from '@/i18n';
import { confirm } from '@/lib/confirm';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';

const CANCELLABLE = ['AWAITING_PAYMENT', 'REQUESTED', 'CONFIRMED'];

export default function CaregiverConsultation() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const { data: c, error, loading, reload } = useFocusData(() => api.consultation(id));
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string>();

  if (loading && !c) return <Loading />;
  if (!c) return <Screen><ErrorText>{errorMessage(error, t)}</ErrorText></Screen>;

  async function cancel() {
    const refund = refundOnCancel(c!);
    const ok = await confirm(t('consultation.cancelConfirm'), c!.paymentStatus === 'PAID' ? t(refund ? 'consultation.refundYes' : 'consultation.refundNo') : undefined, {
      ok: t('consultation.cancel'),
      cancel: t('common.back'),
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.consultationAction(id, 'cancel');
      await reload();
    } catch (e) {
      setActionError(errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ConsultationRoom
        c={c}
        viewer="caregiver"
        onChange={reload}
        actions={
          <>
            {c.status === 'AWAITING_PAYMENT' ? (
              <Button title={t('consultation.pay')} icon="card" variant="pink" onPress={() => router.push({ pathname: '/consultation/[id]/pay', params: { id } })} />
            ) : null}
            {c.drugChart ? (
              <Button title={t('consultation.openMedicines')} icon="medical" variant="outline" onPress={() => router.push({ pathname: '/baby/[id]/medicines', params: { id: c.baby.id } })} />
            ) : null}
            {c.status === 'COMPLETED' && !c.review ? (
              <Button title={t('consultation.review')} icon="heart" variant="pink" onPress={() => router.push({ pathname: '/consultation/[id]/review', params: { id } })} />
            ) : null}
            {CANCELLABLE.includes(c.status) ? <Button title={t('consultation.cancel')} variant="ghost" icon="close-circle-outline" loading={busy} onPress={cancel} /> : null}
            <ErrorText>{actionError}</ErrorText>
          </>
        }
      />
    </Screen>
  );
}
