import { Body, Screen } from '@/components/ui';
import { useClinician } from '@/features/clinician/clinician-context';
import { ClinicianForm } from '@/features/clinician/ClinicianForm';
import { useI18n } from '@/i18n';

export default function Setup() {
  const { t } = useI18n();
  const { set } = useClinician();
  return (
    <Screen>
      <Body muted>{t('clinic.notVerified')}</Body>
      <ClinicianForm initial={null} onSaved={set} />
    </Screen>
  );
}
