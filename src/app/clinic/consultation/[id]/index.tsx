import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, Button, Card, ErrorText, Field, Label, Loading, Screen } from '@/components/ui';
import { ConsultationRoom } from '@/features/consultation/ConsultationRoom';
import { useI18n } from '@/i18n';
import { confirm } from '@/lib/confirm';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, spacing } from '@/theme';

type Action = 'accept' | 'decline' | 'start' | 'complete' | 'no-show' | 'cancel';
const CLINICAL = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];

export default function ClinicianConsultation() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const { data: c, error, loading, reload } = useFocusData(() => api.consultation(id));
  const [busy, setBusy] = useState<Action>();
  const [actionError, setActionError] = useState<string>();
  const [completing, setCompleting] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  if (loading && !c) return <Loading />;
  if (!c) return <Screen><ErrorText>{errorMessage(error, t)}</ErrorText></Screen>;

  async function act(action: Action, body: object = {}) {
    if (action === 'cancel' || action === 'no-show' || action === 'decline') {
      const label = t(action === 'cancel' ? 'consultation.cancel' : action === 'no-show' ? 'clinic.noShow' : 'clinic.decline');
      if (!(await confirm(label, undefined, { ok: label, cancel: t('common.back') }))) return;
    }
    setBusy(action);
    setActionError(undefined);
    try {
      await api.consultationAction(id, action, body);
      setCompleting(false);
      await reload();
    } catch (e) {
      setActionError(errorMessage(e, t));
    } finally {
      setBusy(undefined);
    }
  }

  const go = (path: 'patient' | 'refer' | 'prescribe') => router.push({ pathname: `/clinic/consultation/[id]/${path}`, params: { id } });
  const checklist = c.preConsultChecklist ? Object.entries(c.preConsultChecklist) : [];

  return (
    <Screen>
      <ConsultationRoom
        c={c}
        viewer="clinician"
        onChange={reload}
        top={
          <>
            <Button title={t('clinic.patient')} icon="document-text-outline" variant="outline" onPress={() => go('patient')} />
            {checklist.length ? (
              <Card tint={colors.yellowSoft}>
                <Label>{t('clinic.checklist')}</Label>
                {checklist.map(([k, v]) => (
                  <Body key={k} style={{ fontSize: 15 }}>{v ? '✓' : '✗'} {t(`book.checklist.${k}`)}</Body>
                ))}
              </Card>
            ) : null}
          </>
        }
        actions={
          <View style={{ gap: spacing.sm }}>
            {c.status === 'REQUESTED' ? (
              <View style={styles.row}>
                <Button title={t('clinic.accept')} icon="checkmark" loading={busy === 'accept'} onPress={() => act('accept')} style={{ flex: 1 }} />
                <Button title={t('clinic.decline')} variant="ghost" loading={busy === 'decline'} onPress={() => act('decline')} />
              </View>
            ) : null}
            {c.status === 'CONFIRMED' ? <Button title={t('clinic.start')} icon="play" loading={busy === 'start'} onPress={() => act('start')} /> : null}
            {(c.status === 'CONFIRMED' || c.status === 'IN_PROGRESS') && !completing ? (
              <Button title={t('clinic.complete')} icon="checkmark-done" variant="outline" onPress={() => setCompleting(true)} />
            ) : null}
            {completing ? (
              <Card>
                <Label>{t('clinic.completeTitle')}</Label>
                <Field label={t('clinic.diagnosis')} value={diagnosis} onChangeText={setDiagnosis} maxLength={1000} multiline />
                <Field label={t('clinic.notes')} value={notes} onChangeText={setNotes} maxLength={5000} multiline style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm }} />
                <Button
                  title={t('clinic.complete')}
                  icon="checkmark-done"
                  loading={busy === 'complete'}
                  onPress={() => act('complete', { diagnosisSummary: diagnosis.trim() || undefined, clinicianNotes: notes.trim() || undefined })}
                />
                <Button title={t('common.cancel')} variant="ghost" onPress={() => setCompleting(false)} />
              </Card>
            ) : null}
            {CLINICAL.includes(c.status) ? (
              <View style={styles.row}>
                {!c.referral ? <Button title={t('clinic.refer')} icon="business-outline" variant="outline" onPress={() => go('refer')} style={{ flex: 1 }} /> : null}
                {!c.drugChart ? <Button title={t('clinic.prescribe')} icon="medical-outline" variant="outline" onPress={() => go('prescribe')} style={{ flex: 1 }} /> : null}
              </View>
            ) : null}
            {c.status === 'CONFIRMED' ? (
              <View style={styles.row}>
                <Button title={t('clinic.noShow')} variant="ghost" loading={busy === 'no-show'} onPress={() => act('no-show')} style={{ flex: 1 }} />
                <Button title={t('consultation.cancel')} variant="ghost" loading={busy === 'cancel'} onPress={() => act('cancel')} style={{ flex: 1 }} />
              </View>
            ) : null}
            <ErrorText>{actionError}</ErrorText>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' },
});
