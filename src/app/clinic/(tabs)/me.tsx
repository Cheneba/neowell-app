import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Card, ListRow, Screen } from '@/components/ui';
import { AccountSection } from '@/features/account/AccountSection';
import { useClinician } from '@/features/clinician/clinician-context';
import { ClinicianCard } from '@/features/consultation/ClinicianCard';
import { useI18n } from '@/i18n';
import { colors, fonts } from '@/theme';

export default function ClinicMe() {
  const { t } = useI18n();
  const { profile } = useClinician();
  return (
    <Screen>
      {profile ? (
        <>
          <Text style={styles.h2}>{t('clinic.viewAsMother')}</Text>
          <ClinicianCard c={profile} onPress={() => router.push('/clinic/profile')} />
        </>
      ) : null}
      <Card>
        <ListRow icon="create-outline" title={t('clinic.editProfile')} onPress={() => router.push('/clinic/profile')} />
        <ListRow icon="calendar-outline" title={t('clinic.availability')} onPress={() => router.push('/clinic/availability')} />
        <ListRow icon="shield-checkmark-outline" title={t('clinic.verification')} subtitle={profile ? t(`clinic.statusTitle.${profile.verificationStatus}`) : undefined} onPress={() => router.push('/clinic/documents')} />
      </Card>
      <AccountSection />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
});
