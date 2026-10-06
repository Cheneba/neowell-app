import { Stack } from 'expo-router';
import { useSession } from '@/lib/session';
import { colors } from '@/theme';

export default function OnboardingLayout() {
  const { me } = useSession();
  const needsProfile = !me?.profileComplete;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={needsProfile}>
        <Stack.Screen name="profile" />
      </Stack.Protected>
      <Stack.Protected guard={!needsProfile}>
        <Stack.Screen name="consent" />
      </Stack.Protected>
    </Stack>
  );
}
