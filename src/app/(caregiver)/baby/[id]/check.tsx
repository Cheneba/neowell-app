import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { NetworkError } from '@/api/client';
import type { Answers, Baby, CheckPlan, CheckType, Complaint, ObservationInput, UploadFile } from '@/api/types';
import { Banner, Body, Button, ErrorText, Field, Label, Loading, Screen, Title } from '@/components/ui';
import { ComplaintGrid } from '@/features/checks/ComplaintGrid';
import { newClientRef, offlineQueue } from '@/features/checks/offline-queue';
import { initialAnswers, isVisible, offlineDanger, toObservation } from '@/features/checks/plan';
import { planCache } from '@/features/checks/plan-cache';
import { QuestionRenderer } from '@/features/checks/QuestionRenderer';
import { VoiceRecorder } from '@/features/checks/VoiceRecorder';
import { scheduleRecheck } from '@/features/notifications/notifications';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { babyName } from '@/lib/format';
import { lastResult } from '@/lib/last-result';
import { pickImage } from '@/lib/pick';
import { useSession } from '@/lib/session';
import { spacing } from '@/theme';

/** Routine check, or "baby is unwell" check (complaints first, then follow-up questions). */
export default function Check() {
  const { t, locale } = useI18n();
  const { api } = useSession();
  const params = useLocalSearchParams<{ id: string; type?: string; recheckOf?: string }>();
  const babyId = params.id;
  const type: CheckType = params.type === 'UNWELL' ? 'UNWELL' : 'ROUTINE';
  const recheckOf = params.recheckOf;

  const [baby, setBaby] = useState<Baby>();
  const [complaints, setComplaints] = useState<Complaint[]>(recheckOf ? ['FEVER'] : []);
  const [complaintText, setComplaintText] = useState('');
  const [voice, setVoice] = useState<UploadFile | null>(null);
  const [photo, setPhoto] = useState<UploadFile | null>(null);
  const [plan, setPlan] = useState<CheckPlan>();
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [clientRef] = useState(newClientRef);

  useEffect(() => {
    api.baby(babyId).then(setBaby, () => undefined);
  }, [api, babyId]);

  /** Fetches the plan, falling back to the last cached one when offline. */
  const fetchPlan = useCallback(
    async (chosen: Complaint[]): Promise<{ plan: CheckPlan } | { error: string }> => {
      try {
        const p = await api.checkPlan(babyId, type, chosen, locale);
        void planCache.set(babyId, p, locale);
        return { plan: p };
      } catch (e) {
        const cached = e instanceof NetworkError ? await planCache.get(babyId, type, chosen, locale) : null;
        return cached ? { plan: cached } : { error: errorMessage(e, t) };
      }
    },
    [api, babyId, type, locale, t],
  );

  const applyPlan = useCallback((r: { plan: CheckPlan } | { error: string }) => {
    setLoading(false);
    if ('error' in r) return setError(r.error);
    setError(undefined);
    setPlan(r.plan);
    setAnswers(initialAnswers(r.plan.questions));
  }, []);

  const loadPlan = (chosen: Complaint[]) => {
    setLoading(true);
    void fetchPlan(chosen).then(applyPlan);
  };

  // Routine checks and temperature rechecks go straight to the questions.
  useEffect(() => {
    if (type === 'ROUTINE' || recheckOf) void fetchPlan(recheckOf ? ['FEVER'] : []).then(applyPlan);
  }, [type, recheckOf, fetchPlan, applyPlan]);

  const name = baby ? babyName(baby.displayName, locale) : '';
  const title = type === 'UNWELL' ? t('check.unwellTitle') : t('check.title');

  async function submit() {
    if (!plan) return;
    const body = toObservation(plan.questions, answers);
    if (!body) return setError(t('check.temperatureInvalid'));
    setError(undefined);
    setLoading(true);

    let voiceNoteId: string | undefined;
    if (voice) voiceNoteId = (await api.uploadVoiceNote(babyId, voice).catch(() => null))?.id;

    const input: ObservationInput = {
      ...body,
      temperatureC: body.temperatureC as number,
      checkType: type,
      complaints: type === 'UNWELL' ? complaints : undefined,
      complaintText: complaintText.trim() || undefined,
      clientRef,
      recheckOfId: recheckOf,
      voiceNoteId,
      observedAt: new Date().toISOString(),
    };

    try {
      const result = await api.createObservation(babyId, input);
      if (photo) await api.uploadCheckPhoto(babyId, result.observation.id, photo).catch(() => undefined);
      if (result.recheck) {
        void scheduleRecheck(babyId, result.recheck.id, result.recheck.dueAt, {
          title: t('reminders.recheckTitle', { name }),
          body: t('reminders.recheckBody'),
        });
      }
      lastResult.set({ ...result, babyId, babyName: name, ageDays: baby?.ageDays ?? 0 });
      router.replace('/result');
    } catch (e) {
      setLoading(false);
      if (!(e instanceof NetworkError)) return setError(errorMessage(e, t));
      await offlineQueue.add({ babyId, input, queuedAt: new Date().toISOString() });
      if (offlineDanger(plan.questions, body)) {
        lastResult.set({
          observation: { id: clientRef, checkType: type, complaints, observedAt: input.observedAt!, temperatureC: input.temperatureC, respiratoryRate: null, riskLevel: 'RED', findings: [], actions: [], photoUrl: null },
          assessment: { level: 'RED', findings: [], actions: ['SEEK_CARE_NOW', 'NO_HOME_MEDICINES', 'WARM_SKIN_TO_SKIN_ON_THE_WAY'], engineVersion: 'offline', emergencyNumbers: [] },
          recheck: null,
          babyId,
          babyName: name,
          ageDays: baby?.ageDays ?? 0,
          queued: true,
        });
        return router.replace('/result');
      }
      if (Platform.OS === 'web') window.alert(t('check.offlineSaved'));
      else Alert.alert(t('check.offlineSaved'));
      router.dismissTo('/');
    }
  }

  // Step 1 of the unwell check: what is worrying you?
  if (type === 'UNWELL' && !plan && !recheckOf) {
    return (
      <Screen
        footer={<Button title={t('common.next')} icon="arrow-forward" variant="pink" loading={loading} disabled={complaints.length === 0} onPress={() => loadPlan(complaints)} />}
      >
        <Stack.Screen options={{ title }} />
        <Title style={{ fontSize: 22 }}>{t('check.whatsWrong')}</Title>
        <Body muted>{t('check.pickAny')}</Body>
        <ComplaintGrid selected={complaints} onToggle={(c) => setComplaints((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]))} />
        <Field label={t('check.describe')} placeholder={t('check.describeHint')} value={complaintText} onChangeText={setComplaintText} multiline maxLength={1000} style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm }} />
        {Platform.OS !== 'web' ? (
          <View style={{ gap: spacing.xs }}>
            <Label>{t('check.voice')}</Label>
            <VoiceRecorder value={voice} onChange={setVoice} />
          </View>
        ) : null}
        <ErrorText>{error}</ErrorText>
      </Screen>
    );
  }

  if (!plan) {
    return error ? (
      <Screen>
        <Stack.Screen options={{ title }} />
        <ErrorText>{error}</ErrorText>
        <Button title={t('common.retry')} variant="outline" icon="refresh" onPress={() => loadPlan(complaints)} />
      </Screen>
    ) : (
      <Loading />
    );
  }

  const set = (field: string) => (v: Answers[string]) => setAnswers((a) => ({ ...a, [field]: v }));
  return (
    <Screen footer={<Button title={t('check.submit')} onPress={submit} loading={loading} icon="checkmark-circle" />}>
      <Stack.Screen options={{ title }} />
      {name ? <Title style={{ fontSize: 22 }}>{name}</Title> : null}
      {recheckOf ? <Banner tone="danger" icon="thermometer">{t('result.recheckTitle')}</Banner> : null}
      {plan.questions
        .filter((q) => isVisible(q, answers))
        .map((q) => (
          <QuestionRenderer key={q.id} q={q} value={answers[q.field]} onChange={set(q.field)} />
        ))}
      <Button
        title={photo ? t('check.photoAdded') : t('check.addPhoto')}
        icon={photo ? 'checkmark-circle' : 'camera-outline'}
        variant="outline"
        onPress={async () => setPhoto((await pickImage(Platform.OS === 'web' ? 'gallery' : 'camera')) ?? photo)}
      />
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}
