import { StyleSheet, View } from 'react-native';
import { LanguageSwitch } from '@/components/language-switch';
import { Body, Button, Card, Label, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { formatPhone } from '@/lib/phone';
import { useSession } from '@/lib/session';
import { spacing } from '@/theme';

export default function Settings() {
  const { t } = useI18n();
  const { me, signOut } = useSession();
  return (
    <Screen>
      <Card>
        <Label>{t('settings.language')}</Label>
        <View style={styles.left}>
          <LanguageSwitch />
        </View>
      </Card>
      <Card>
        <Label>{t('settings.phone')}</Label>
        <Body>{me ? formatPhone(me.phone) : ''}</Body>
      </Card>
      <Button title={t('settings.signOut')} icon="log-out-outline" variant="outline" onPress={signOut} style={{ marginTop: spacing.lg }} />
    </Screen>
  );
}

const styles = StyleSheet.create({ left: { alignItems: 'flex-start' } });
