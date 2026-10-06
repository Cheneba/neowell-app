import { router } from 'expo-router';
import { Screen } from '@/components/ui';
import { useClinician } from '@/features/clinician/clinician-context';
import { ClinicianForm } from '@/features/clinician/ClinicianForm';

export default function EditClinicianProfile() {
  const { profile, set } = useClinician();
  return (
    <Screen>
      <ClinicianForm
        initial={profile}
        onSaved={(p) => {
          set(p);
          router.back();
        }}
      />
    </Screen>
  );
}
