import { useState } from 'react';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';
import { LanguageSwitch } from '@/components/language-switch';
import { Banner, Body, Button, Card, CheckRow, ErrorText, ListRow } from '@/components/ui';
import { type Locale, useI18n } from '@/i18n';
import { confirm } from '@/lib/confirm';
import { errorMessage } from '@/lib/errors';
import { formatPhone } from '@/lib/phone';
import { useSession } from '@/lib/session';
import { colors, fonts, spacing } from '@/theme';

/** Profile, language, consents, data export, deletion and sign-out (FR-ACC). */
export function AccountSection() {
  const { t, locale } = useI18n();
  const { api, me, setMe, signOut } = useSession();
  const [error, setError] = useState<string>();
  const [exported, setExported] = useState(false);
  if (!me) return null;
  const caregiver = me.role === 'CAREGIVER';

  async function saveLocale(l: Locale) {
    if (l !== me!.locale) setMe(await api.updateMe({ locale: l }).catch(() => me!));
  }

  async function toggle(key: 'clinicianShare' | 'recording', value: boolean) {
    try {
      setMe(await api.updateConsents({ [key]: value }));
    } catch (e) {
      setError(errorMessage(e, t));
    }
  }

  async function exportData() {
    try {
      const json = JSON.stringify(await api.exportData(), null, 2);
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'neowell-export.json';
        a.click();
      } else await Share.share({ message: json, title: 'neowell-export.json' });
      setExported(true);
    } catch (e) {
      setError(errorMessage(e, t));
    }
  }

  async function deleteAccount() {
    const ok = await confirm(t('me.deleteAccount'), t('me.deleteConfirm'), { ok: t('me.deleteAccount'), cancel: t('common.cancel') });
    if (!ok) return;
    try {
      await api.deleteAccount();
      await signOut();
    } catch (e) {
      setError(errorMessage(e, t));
    }
  }

  return (
    <>
      <Card>
        <Text style={styles.h2}>{t('me.profile')}</Text>
        <ListRow icon="person-outline" title={[me.firstName, me.lastName].filter(Boolean).join(' ')} subtitle={`${t('me.phone')}: ${formatPhone(me.phone)}`} />
        <View style={{ gap: spacing.xs }}>
          <Body muted style={{ fontSize: 14 }}>{t('me.language')}</Body>
          <View style={{ alignSelf: 'flex-start' }}>
            <LanguageSwitch onChange={saveLocale} />
          </View>
        </View>
      </Card>

      {caregiver ? (
        <Card>
          <Text style={styles.h2}>{t('me.consents')}</Text>
          <CheckRow checked={!!me.consentClinicianShareAt} onToggle={() => toggle('clinicianShare', !me.consentClinicianShareAt)} label={t('consent.clinicianShare')} />
          <CheckRow checked={!!me.consentRecordingAt} onToggle={() => toggle('recording', !me.consentRecordingAt)} label={t('consent.recording')} />
        </Card>
      ) : null}

      <Card>
        <ListRow icon="download-outline" title={t('me.exportData')} onPress={exportData} />
        {exported ? <Banner tone="success">{t('me.exported')}</Banner> : null}
        <ListRow icon="trash-outline" title={t('me.deleteAccount')} onPress={deleteAccount} />
      </Card>
      <ErrorText>{error}</ErrorText>
      <Button title={t('me.signOut')} variant="outline" icon="log-out-outline" onPress={signOut} />
      <Body muted style={{ fontSize: 12, textAlign: 'center' }}>NeoWell · {locale.toUpperCase()}</Body>
    </>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
});
