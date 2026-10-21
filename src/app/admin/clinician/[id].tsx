import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AdminClinician, AdminDecision, AdminDocument } from '@/api/types';
import { Avatar, Banner, Body, Button, Card, ErrorText, Field, Loading, Pill, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { confirm } from '@/lib/confirm';
import { errorMessage } from '@/lib/errors';
import { dateLabel } from '@/lib/format';
import { formatPhone } from '@/lib/phone';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

const REQUIRED = ['MEDICAL_LICENSE', 'MEDICAL_DEGREE', 'EMPLOYMENT_PROOF'];

const TONE: Record<AdminClinician['verificationStatus'], 'warning' | 'info' | 'success' | 'danger'> = {
  PENDING_DOCUMENTS: 'warning',
  PENDING_REVIEW: 'info',
  VERIFIED: 'success',
  REJECTED: 'danger',
  SUSPENDED: 'danger',
};

/** Full profile + documents for one clinician, with approve/reject/suspend. */
export default function AdminClinicianReview() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const { data: c, error, loading } = useFocusData(async () => {
    const rows = await api.adminClinicians();
    const found = rows.find((r) => r.id === id);
    if (!found) throw new Error('not-found');
    return found;
  });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<AdminDecision>();
  const [actionError, setActionError] = useState<string>();

  if (loading && !c) return <Loading />;
  if (!c) return <Screen><ErrorText>{errorMessage(error, t)}</ErrorText></Screen>;

  const name =
    [c.user.firstName ?? c.firstName, c.user.lastName ?? c.lastName].filter(Boolean).join(' ') || c.title;
  const missing = REQUIRED.filter((type) => !c.documents.some((d) => d.type === type));
  if (!c.photoUrl) missing.unshift('PHOTO');

  async function decide(decision: AdminDecision) {
    if (!c) return;
    const copy = {
      VERIFIED: t('admin.confirmVerify'),
      REJECTED: t('admin.confirmReject'),
      SUSPENDED: t('admin.confirmSuspend'),
    }[decision];
    const ok = await confirm(t(`admin.${decision.toLowerCase()}`), copy, {
      ok: t(`admin.${decision.toLowerCase()}`),
      cancel: t('admin.cancel'),
    });
    if (!ok) return;
    setBusy(decision);
    setActionError(undefined);
    try {
      await api.adminReview(c.id, decision, note.trim() || undefined);
      router.back();
    } catch (e) {
      setActionError(errorMessage(e, t));
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <Screen>
      <Card>
        <View style={styles.head}>
          <Avatar name={name} uri={c.photoUrl} size={64} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.name}>{name}</Text>
            <Body muted style={{ fontSize: 14 }}>{c.title}</Body>
            <Pill tone={TONE[c.verificationStatus]} label={t(`admin.filters.${c.verificationStatus}`)} />
          </View>
        </View>
        <Body muted style={{ fontSize: 14 }}>{t('admin.license')}: {c.licenseNumber}</Body>
        {c.specialties.length ? <Body muted style={{ fontSize: 14 }}>{t('admin.specialties')}: {c.specialties.join(', ')}</Body> : null}
        {c.currentFacility ? <Body muted style={{ fontSize: 14 }}>{t('admin.facility')}: {c.currentFacility}</Body> : null}
        {c.yearsExperience != null ? <Body muted style={{ fontSize: 14 }}>{t('admin.years')}: {c.yearsExperience}</Body> : null}
        <Body muted style={{ fontSize: 14 }}>{t('admin.contact')}: {formatPhone(c.user.phone)}{c.user.email ? ` · ${c.user.email}` : ''}</Body>
        {c.payoutPhone ? <Body muted style={{ fontSize: 14 }}>{t('admin.payout')}: {c.payoutPhone} ({c.payoutProvider})</Body> : null}
      </Card>

      {c.verificationNote ? <Banner tone="danger">{c.verificationNote}</Banner> : null}
      {missing.length ? <Banner tone="warning">{t('admin.missing')}</Banner> : null}

      <Text style={styles.h2}>{t('admin.documents')}</Text>
      {c.documents.length === 0 ? <Body muted>{t('admin.noDocuments')}</Body> : null}
      {c.documents.map((d) => (
        <DocumentCard key={d.id} doc={d} />
      ))}

      <Field
        label={t('admin.note')}
        value={note}
        onChangeText={setNote}
        placeholder={t('admin.notePlaceholder')}
        multiline
        numberOfLines={3}
        style={{ minHeight: 88, textAlignVertical: 'top' }}
      />
      <ErrorText>{actionError}</ErrorText>
      <Button
        title={t('admin.verify')}
        icon="checkmark-circle"
        loading={busy === 'VERIFIED'}
        disabled={!!busy || missing.length > 0}
        onPress={() => decide('VERIFIED')}
      />
      <Button title={t('admin.reject')} variant="danger" icon="close-circle" loading={busy === 'REJECTED'} disabled={!!busy} onPress={() => decide('REJECTED')} />
      <Button title={t('admin.suspend')} variant="outline" icon="pause-circle" loading={busy === 'SUSPENDED'} disabled={!!busy} onPress={() => decide('SUSPENDED')} />
    </Screen>
  );
}

function DocumentCard({ doc }: { doc: AdminDocument }) {
  const { t, locale } = useI18n();
  const isPdf = /\.pdf$/i.test(doc.originalName);
  return (
    <Card>
      <Text style={styles.docTitle}>{t(`clinic.docs.${doc.type}`)}</Text>
      <Body muted style={{ fontSize: 13 }}>{doc.originalName}</Body>
      <Body muted style={{ fontSize: 12 }}>{dateLabel(doc.uploadedAt, locale)}</Body>
      {doc.url && !isPdf ? (
        <Image source={{ uri: doc.url }} style={styles.preview} contentFit="contain" />
      ) : null}
      {doc.url ? (
        <Button
          title={t('admin.open')}
          variant="outline"
          icon="open-outline"
          onPress={() => WebBrowser.openBrowserAsync(doc.url as string)}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontFamily: fonts.extrabold, fontSize: 19, color: colors.ink },
  h2: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  docTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  preview: { width: '100%', height: 220, borderRadius: 12, backgroundColor: colors.blueSoft },
});
