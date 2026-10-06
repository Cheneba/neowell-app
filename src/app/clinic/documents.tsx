import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { UploadFile, VerificationStatus } from '@/api/types';
import { Avatar, Banner, Body, Button, Card, ErrorText, Screen } from '@/components/ui';
import { useClinician } from '@/features/clinician/clinician-context';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { pickImage, pickPdf } from '@/lib/pick';
import { useSession } from '@/lib/session';
import { colors, fonts, spacing } from '@/theme';

const DOCS = ['MEDICAL_LICENSE', 'MEDICAL_DEGREE', 'EMPLOYMENT_PROOF'] as const;
const TONE: Record<VerificationStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  PENDING_DOCUMENTS: 'warning',
  PENDING_REVIEW: 'info',
  VERIFIED: 'success',
  REJECTED: 'danger',
  SUSPENDED: 'danger',
};

/** Verification checklist: profile photo + three documents (FR-CLIN-03). */
export default function Documents() {
  const { t } = useI18n();
  const { api } = useSession();
  const { profile, reload } = useClinician();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  if (!profile) return null;

  async function upload(kind: string, pick: () => Promise<UploadFile | null>) {
    const file = await pick();
    if (!file) return;
    setBusy(kind);
    setError(undefined);
    try {
      if (kind === 'PHOTO') await api.uploadClinicianPhoto(file);
      else await api.uploadClinicianDocument(kind, file);
      await reload();
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setBusy(undefined);
    }
  }

  const camera = Platform.OS === 'web' ? 'gallery' : 'camera';
  return (
    <Screen>
      <Banner tone={TONE[profile.verificationStatus]}>{t(`clinic.statusTitle.${profile.verificationStatus}`)}</Banner>
      {profile.verificationNote ? <Body muted>{profile.verificationNote}</Body> : null}

      <Card>
        <Row done={!profile.missingForReview.includes('PHOTO')} label={t('clinic.docs.PHOTO')} />
        {profile.photoUrl ? <Avatar name={profile.displayName} uri={profile.photoUrl} size={72} /> : null}
        <View style={styles.buttons}>
          <Button title={t('clinic.camera')} icon="camera" variant="outline" loading={busy === 'PHOTO'} onPress={() => upload('PHOTO', () => pickImage(camera))} style={styles.button} />
        </View>
      </Card>

      {DOCS.map((d) => {
        const done = !profile.missingDocuments.includes(d);
        return (
          <Card key={d}>
            <Row done={done} label={t(`clinic.docs.${d}`)} />
            {profile.documents.filter((x) => x.type === d).map((x) => (
              <Body key={x.id} muted style={{ fontSize: 13 }}>{x.originalName}</Body>
            ))}
            <View style={styles.buttons}>
              <Button title={t('clinic.pdf')} icon="document" variant="outline" loading={busy === d} onPress={() => upload(d, pickPdf)} style={styles.button} />
              <Button title={t('clinic.gallery')} icon="image" variant="ghost" onPress={() => upload(d, () => pickImage('gallery'))} style={styles.button} />
            </View>
          </Card>
        );
      })}
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

function Row({ done, label }: { done: boolean; label: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={done ? colors.green : colors.muted} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  buttons: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  button: { minHeight: 48, paddingHorizontal: spacing.md },
});
