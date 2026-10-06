import { colors, fonts } from '@/theme';

/** Header style shared by every stack (white header, brand-blue back button). */
export function stackOptions(backTitle: string) {
  return {
    headerTintColor: colors.blueDeep,
    headerTitleStyle: { fontFamily: fonts.bold, color: colors.ink },
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.white },
    headerBackTitle: backTitle,
    contentStyle: { backgroundColor: colors.background },
  } as const;
}

/** Tab bar style shared by the caregiver and clinician tabs. */
export const tabOptions = {
  tabBarActiveTintColor: colors.blueDeep,
  tabBarInactiveTintColor: colors.muted,
  tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 12 },
  tabBarStyle: { borderTopColor: colors.border, minHeight: 60 },
  headerTitleStyle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 20 },
  headerShadowVisible: false,
  sceneStyle: { backgroundColor: colors.background },
} as const;
