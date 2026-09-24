import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Card, ErrorText, Screen, Title } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { colors, fonts, spacing } from '@/theme';

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
      <Checkbox checked={dataCollection} onToggle={() => setDataCollection((v) => !v)} label={t('consent.dataCollection')} />
      <Checkbox checked={clinicianShare} onToggle={() => setClinicianShare((v) => !v)} label={t('consent.clinicianShare')} />
      <Card tint={colors.pinkSoft}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Ionicons name="information-circle" size={22} color={colors.pinkDeep} />
          <Body style={{ flex: 1, fontSize: 15 }}>{t('consent.disclaimer')}</Body>
        </View>
      </Card>
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

function Checkbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[styles.check, checked && { borderColor: colors.blue, backgroundColor: colors.blueSoft }]}
    >
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={28} color={colors.blueDeep} />
      <Text style={styles.checkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  check: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
  },
  checkText: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, lineHeight: 22 },
});
