import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import type { Baby, Clinician, Medium } from '@/api/types';
import { Body, Button, Card, CheckRow, ChoiceGroup, ErrorText, Field, Label, Loading, Screen } from '@/components/ui';
import { bookingContext } from '@/features/consultation/booking-context';
import { MEDIUM_ICON } from '@/features/consultation/status';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { babyName, clockLabel, money } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, fonts, radius, spacing } from '@/theme';

const CHECKLIST = ['removedClothes', 'cooledRoom', 'sponged', 'rechecked'] as const;

export default function Book() {
  const { t, locale } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const context = bookingContext.get();

  const [clinician, setClinician] = useState<Clinician>();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [babyId, setBabyId] = useState<string | undefined>(context?.babyId);
  const [medium, setMedium] = useState<Medium>();
  const [timing, setTiming] = useState<'ASAP' | 'SCHEDULED'>('SCHEDULED');
  const [slot, setSlot] = useState<string>();
  const [reason, setReason] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const loadSlots = () => api.slots(id, 7).then((r) => setSlots(r.slots), () => setSlots([]));

  useEffect(() => {
    Promise.all([api.clinician(id), api.babies()]).then(([c, bs]) => {
      setClinician(c);
      setBabies(bs);
      setBabyId((cur) => cur ?? bs[0]?.id);
      setMedium(Object.keys(c.media)[0] as Medium | undefined);
      if (c.availableNow) setTiming('ASAP');
    }, (e) => setError(errorMessage(e, t)));
    void loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, id]);

  const byDay = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const s of slots) {
      const day = new Date(s).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
      groups.set(day, [...(groups.get(day) ?? []), s]);
    }
    return [...groups.entries()].slice(0, 4);
  }, [slots, locale]);

  if (!clinician) return error ? <Screen><ErrorText>{error}</ErrorText></Screen> : <Loading />;
  const fee = medium ? clinician.media[medium] ?? 0 : 0;
  const showChecklist = !!context?.fever && context.babyId === babyId;

  async function book() {
    if (!babyId || !medium || (timing === 'SCHEDULED' && !slot)) return setError(t('baby.required'));
    setError(undefined);
    setLoading(true);
    try {
      const c = await api.book({
        babyId,
        clinicianId: id,
        medium,
        timing,
        scheduledAt: timing === 'SCHEDULED' ? slot : undefined,
        reason: reason.trim() || undefined,
        observationId: context?.babyId === babyId ? context.observationId : undefined,
        preConsultChecklist: showChecklist ? Object.fromEntries(CHECKLIST.map((k) => [k, !!checklist[k]])) : undefined,
      });
      bookingContext.set(null);
      router.replace({ pathname: '/consultation/[id]/pay', params: { id: c.id } });
    } catch (e) {
      setLoading(false);
      if (e instanceof ApiError && e.status === 409) {
        setSlot(undefined);
        void loadSlots();
        return setError(t('book.slotTaken'));
      }
      setError(errorMessage(e, t));
    }
  }

  return (
    <Screen
      footer={
        <>
          <View style={styles.total}>
            <Body>{t('book.total')}</Body>
            <Text style={styles.totalValue}>{money(fee)}</Text>
          </View>
          <Button title={t('book.continueToPay')} icon="card" variant="pink" loading={loading} onPress={book} />
        </>
      }
    >
      {babies.length > 1 ? (
        <ChoiceGroup label={t('book.baby')} icon="happy-outline" value={babyId} onChange={setBabyId} options={babies.map((b) => ({ value: b.id, label: babyName(b.displayName, locale) }))} />
      ) : null}

      <Label>{t('book.medium')}</Label>
      {(Object.keys(clinician.media) as Medium[]).map((m) => (
        <Pressable key={m} onPress={() => setMedium(m)} accessibilityRole="radio" accessibilityState={{ selected: medium === m }} style={[styles.medium, medium === m && styles.selected]}>
          <Ionicons name={MEDIUM_ICON[m]} size={26} color={colors.blueDeep} />
          <View style={{ flex: 1 }}>
            <Text style={styles.mediumTitle}>{t(`doctors.media.${m}`)}</Text>
            <Body muted style={{ fontSize: 14 }}>{t(`doctors.mediaHint.${m}`)}</Body>
          </View>
          <Text style={styles.price}>{money(clinician.media[m]!)}</Text>
        </Pressable>
      ))}

      <Label>{t('book.when')}</Label>
      {clinician.availableNow ? (
        <CheckRow checked={timing === 'ASAP'} onToggle={() => setTiming(timing === 'ASAP' ? 'SCHEDULED' : 'ASAP')} label={t('book.asap')} />
      ) : null}
      {timing === 'SCHEDULED' ? (
        byDay.length === 0 ? (
          <Body muted>{t('book.noSlots')}</Body>
        ) : (
          byDay.map(([day, times]) => (
            <View key={day} style={{ gap: spacing.xs }}>
              <Body style={{ fontFamily: fonts.bold }}>{day}</Body>
              <View style={styles.chips}>
                {times.map((s) => (
                  <Pressable key={s} onPress={() => setSlot(s)} accessibilityRole="radio" accessibilityState={{ selected: slot === s }} style={[styles.chip, slot === s && styles.selected]}>
                    <Text style={styles.chipText}>{clockLabel(s, locale)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )
      ) : null}

      <Field label={t('book.reason')} value={reason} onChangeText={setReason} multiline maxLength={1000} style={{ minHeight: 88, textAlignVertical: 'top', paddingTop: spacing.sm }} />

      {showChecklist ? (
        <Card tint={colors.yellowSoft}>
          <Label>{t('book.checklistTitle')}</Label>
          {CHECKLIST.map((k) => (
            <CheckRow key={k} checked={!!checklist[k]} onToggle={() => setChecklist((c) => ({ ...c, [k]: !c[k] }))} label={t(`book.checklist.${k}`)} />
          ))}
        </Card>
      ) : null}
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  medium: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md },
  selected: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  mediumTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  price: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.pinkDeep },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border, justifyContent: 'center' },
  chipText: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalValue: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
});
