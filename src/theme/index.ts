/**
 * NeoWell design tokens. Brand = logo blue + logo pink on white.
 * The `*Deep` shades are for text and buttons on white, where the lighter
 * logo colours would be too faint to read (WCAG AA contrast).
 */
export const colors = {
  blue: '#62A6EA', // logo blue — decoration, icons, borders
  blueDeep: '#2C6CB5', // text + primary buttons on white
  blueSoft: '#EAF3FD', // tinted backgrounds
  pink: '#F0849F', // logo pink — accents, hearts
  pinkDeep: '#C2446A', // text + secondary buttons on white
  pinkSoft: '#FDEEF2',
  white: '#FFFFFF',
  background: '#FFFFFF',
  ink: '#1E2B3C', // body text
  muted: '#5E6E82', // secondary text
  border: '#DDE7F2',

  // Traffic-light states. Always paired with an icon and a text label (PDR §6).
  green: '#1E8A4C',
  greenSoft: '#E6F5EC',
  yellow: '#9A6A00',
  yellowBright: '#F2B705',
  yellowSoft: '#FFF5D6',
  red: '#C62828',
  redSoft: '#FDE7E7',
} as const;

export const fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;

/** Minimum touch target — large buttons for tired, busy parents (PDR §6). */
export const TOUCH = 56;

export type RiskLevel = 'GREEN' | 'YELLOW' | 'RED';

export const riskStyle: Record<RiskLevel, { fg: string; bg: string; dot: string; icon: string }> = {
  GREEN: { fg: colors.green, bg: colors.greenSoft, dot: colors.green, icon: 'checkmark-circle' },
  YELLOW: {
    fg: colors.yellow,
    bg: colors.yellowSoft,
    dot: colors.yellowBright,
    icon: 'alert-circle',
  },
  RED: { fg: colors.red, bg: colors.redSoft, dot: colors.red, icon: 'warning' },
};
