import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ClinicianInput, MyClinicianProfile } from '@/api/types';
import { Banner, Button, CheckRow, ChoiceGroup, ErrorText, Field, Label } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { formatPhone, toE164 } from '@/lib/phone';
import { useSession } from '@/lib/session';
import { colors, fonts, spacing } from '@/theme';

type Payout = 'MTN_MOMO' | 'ORANGE_MONEY';
const MEDIA = [
  { key: 'Chat', offer: 'offersChat', fee: 'feeChatXaf', medium: 'CHAT', fallback: '2000' },
  { key: 'Audio', offer: 'offersAudio', fee: 'feeAudioXaf', medium: 'AUDIO', fallback: '3000' },
  { key: 'Video', offer: 'offersVideo', fee: 'feeVideoXaf', medium: 'VIDEO', fallback: '5000' },
] as const;

/** Professional profile form for setup and editing (FR-CLIN-01/02). */
export function ClinicianForm({ initial, onSaved }: { initial: MyClinicianProfile | null; onSaved: (p: MyClinicianProfile) => void }) {
  const { t } = useI18n();
  const { api, me } = useSession();
  const [v, setV] = useState({
    firstName: initial?.firstName ?? me?.firstName ?? '',
    lastName: initial?.lastName ?? me?.lastName ?? '',
    title: initial?.title ?? 'Dr',
    licenseNumber: initial?.licenseNumber ?? '',
    specialties: initial?.specialties.join(', ') ?? '',
    bio: initial?.bio ?? '',
    currentFacility: initial?.currentFacility ?? '',
    yearsExperience: initial?.yearsExperience != null ? String(initial.yearsExperience) : '',
    offersChat: initial?.offersChat ?? true,
    offersAudio: initial?.offersAudio ?? true,
    offersVideo: initial?.offersVideo ?? true,
    feeChatXaf: String(initial?.feeChatXaf ?? MEDIA[0].fallback),
    feeAudioXaf: String(initial?.feeAudioXaf ?? MEDIA[1].fallback),
    feeVideoXaf: String(initial?.feeVideoXaf ?? MEDIA[2].fallback),
    payoutProvider: (initial?.payoutProvider ?? 'MTN_MOMO') as Payout,
    payoutPhone: initial?.payoutPhone ? formatPhone(initial.payoutPhone).replace('+237 ', '') : '',
  });
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const set = (patch: Partial<typeof v>) => setV((cur) => ({ ...cur, ...patch }));

  async function save() {
    if (!v.firstName.trim() || !v.lastName.trim() || !v.licenseNumber.trim()) return setError(t('baby.required'));
    const payoutPhone = v.payoutPhone.trim() ? toE164(v.payoutPhone) : undefined;
    if (payoutPhone === null) return setError(t('auth.invalidPhone'));
    const body: ClinicianInput = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      title: v.title.trim() || undefined,
      licenseNumber: v.licenseNumber.trim(),
      specialties: v.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      bio: v.bio.trim() || undefined,
      currentFacility: v.currentFacility.trim() || undefined,
      yearsExperience: v.yearsExperience ? Number(v.yearsExperience) : undefined,
      offersChat: v.offersChat,
      offersAudio: v.offersAudio,
      offersVideo: v.offersVideo,
      feeChatXaf: Number(v.feeChatXaf) || 0,
      feeAudioXaf: Number(v.feeAudioXaf) || 0,
      feeVideoXaf: Number(v.feeVideoXaf) || 0,
      payoutProvider: payoutPhone ? v.payoutProvider : undefined,
      payoutPhone,
    };
    setError(undefined);
    setLoading(true);
    try {
      onSaved(initial ? await api.updateClinician(body) : await api.registerClinician(body));
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setLoading(false);
    }
  }

  const digits = (key: keyof typeof v, max: number) => (x: string) => set({ [key]: x.replace(/\D/g, '').slice(0, max) } as Partial<typeof v>);
  return (
    <>
      <Field label={t('clinic.title')} value={v.title} onChangeText={(title) => set({ title })} maxLength={10} />
      <Field label={t('profile.firstName')} value={v.firstName} onChangeText={(firstName) => set({ firstName })} autoCapitalize="words" />
      <Field label={t('profile.lastName')} value={v.lastName} onChangeText={(lastName) => set({ lastName })} autoCapitalize="words" />
      <Field label={t('clinic.license')} value={v.licenseNumber} onChangeText={(licenseNumber) => set({ licenseNumber })} autoCapitalize="characters" />
      <Field label={t('clinic.specialties')} hint={t('clinic.specialtiesHint')} value={v.specialties} onChangeText={(specialties) => set({ specialties })} />
      <Field label={t('clinic.facility')} value={v.currentFacility} onChangeText={(currentFacility) => set({ currentFacility })} />
      <Field label={t('clinic.years')} value={v.yearsExperience} onChangeText={digits('yearsExperience', 2)} keyboardType="number-pad" />
      <Field label={t('clinic.bio')} value={v.bio} onChangeText={(bio) => set({ bio })} multiline maxLength={1000} style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm }} />

      <Text style={styles.h2}>{t('clinic.mediaFees')}</Text>
      <Banner tone="info">{t('clinic.feeHint')}</Banner>
      {MEDIA.map((m) => (
        <View key={m.key} style={styles.media}>
          <View style={{ flex: 1 }}>
            <CheckRow checked={v[m.offer]} onToggle={() => set({ [m.offer]: !v[m.offer] } as Partial<typeof v>)} label={t(`doctors.media.${m.medium}`)} />
          </View>
          <Field value={v[m.fee]} onChangeText={digits(m.fee, 6)} keyboardType="number-pad" style={styles.fee} accessibilityLabel={`${t(`doctors.media.${m.medium}`)} FCFA`} editable={v[m.offer]} />
        </View>
      ))}

      <Label>{t('clinic.payout')}</Label>
      <ChoiceGroup<Payout>
        label={t('pay.provider')}
        icon="wallet-outline"
        value={v.payoutProvider}
        onChange={(payoutProvider) => set({ payoutProvider })}
        options={(['MTN_MOMO', 'ORANGE_MONEY'] as const).map((p) => ({ value: p, label: t(`pay.${p}`) }))}
      />
      <Field label={t('pay.payerPhone')} value={v.payoutPhone} onChangeText={(payoutPhone) => set({ payoutPhone })} keyboardType="phone-pad" placeholder="6 70 00 00 00" />
      <ErrorText>{error}</ErrorText>
      <Button title={t('clinic.saveProfile')} icon="checkmark-circle" loading={loading} onPress={save} />
    </>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink, marginTop: spacing.sm },
  media: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fee: { width: 110, textAlign: 'right' },
});
