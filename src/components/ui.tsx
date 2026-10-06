import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, TOUCH } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({
  children,
  scroll = true,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Title({ children, style, ...rest }: TextProps & { children: ReactNode }) {
  return (
    <Text style={[styles.title, style]} accessibilityRole="header" {...rest}>
      {children}
    </Text>
  );
}

export function Body({ children, style, muted, ...rest }: TextProps & { muted?: boolean; children: ReactNode }) {
  return (
    <Text style={[styles.body, muted && { color: colors.muted }, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <View style={styles.error} accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle" size={18} color={colors.red} />
      <Text style={styles.errorText}>{children}</Text>
    </View>
  );
}

type ButtonVariant = 'primary' | 'pink' | 'outline' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const v = buttonVariants[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && { opacity: 0.85 },
        inactive && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={22} color={v.fg} /> : null}
          <Text style={[styles.buttonText, { color: v.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.blueDeep, fg: colors.white, border: colors.blueDeep },
  pink: { bg: colors.pinkDeep, fg: colors.white, border: colors.pinkDeep },
  outline: { bg: colors.white, fg: colors.blueDeep, border: colors.blue },
  ghost: { bg: 'transparent', fg: colors.blueDeep, border: 'transparent' },
  danger: { bg: colors.red, fg: colors.white, border: colors.red },
};

export function Field({ label, hint, style, ...rest }: TextInputProps & { label?: string; hint?: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, style]}
        accessibilityLabel={label}
        {...rest}
      />
      {hint ? <Body muted style={{ fontSize: 14 }}>{hint}</Body> : null}
    </View>
  );
}

export function Card({ children, style, tint }: { children: ReactNode; style?: ViewStyle; tint?: string }) {
  return <View style={[styles.card, tint ? { backgroundColor: tint, borderColor: tint } : null, style]}>{children}</View>;
}

/** A group of large, single-choice option chips (one question of the daily check). */
export function ChoiceGroup<T extends string>({
  label,
  icon,
  options,
  value,
  onChange,
  danger = [],
}: {
  label: string;
  icon: IconName;
  options: { value: T; label: string }[];
  value?: T;
  onChange: (v: T) => void;
  /** Option values that are danger signs — shown with a red outline when selected. */
  danger?: T[];
}) {
  return (
    <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <View style={styles.row}>
        <View style={styles.iconBubble}>
          <Ionicons name={icon} size={20} color={colors.blueDeep} />
        </View>
        <Text style={styles.groupLabel}>{label}</Text>
      </View>
      <View style={styles.chips}>
        {options.map((o) => {
          const selected = o.value === value;
          const isDanger = selected && danger.includes(o.value);
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                selected && styles.chipSelected,
                isDanger && { borderColor: colors.red, backgroundColor: colors.redSoft },
              ]}
            >
              {selected ? (
                <Ionicons name="checkmark" size={18} color={isDanger ? colors.red : colors.blueDeep} />
              ) : null}
              <Text style={[styles.chipText, selected && { color: isDanger ? colors.red : colors.blueDeep }]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.blue} />
      {label ? <Body muted>{label}</Body> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, color: colors.ink },
  label: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  error: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.redSoft,
    padding: spacing.sm + 2,
    borderRadius: radius.sm,
  },
  errorText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.red, flex: 1 },
  button: {
    minHeight: TOUCH,
    borderRadius: radius.pill,
    borderWidth: 2,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonText: { fontFamily: fonts.bold, fontSize: 18 },
  input: {
    minHeight: TOUCH,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupLabel: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipSelected: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  chipText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
});

// ── v2 additions ────────────────────────────────────────────

type Tone = 'info' | 'warning' | 'danger' | 'success' | 'pink';
const TONES: Record<Tone, { bg: string; fg: string; icon: IconName }> = {
  info: { bg: colors.blueSoft, fg: colors.blueDeep, icon: 'information-circle' },
  warning: { bg: colors.yellowSoft, fg: colors.yellow, icon: 'alert-circle' },
  danger: { bg: colors.redSoft, fg: colors.red, icon: 'warning' },
  success: { bg: colors.greenSoft, fg: colors.green, icon: 'checkmark-circle' },
  pink: { bg: colors.pinkSoft, fg: colors.pinkDeep, icon: 'heart' },
};

/** Inline notice with an optional action. */
export function Banner({
  tone = 'info',
  icon,
  children,
  action,
  onAction,
}: {
  tone?: Tone;
  icon?: IconName;
  children: ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  const t = TONES[tone];
  return (
    <View style={[v2.banner, { backgroundColor: t.bg }]} accessibilityRole="alert">
      <Ionicons name={icon ?? t.icon} size={22} color={t.fg} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={[v2.bannerText, { color: t.fg }]}>{children}</Text>
        {action ? (
          <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
            <Text style={[v2.bannerAction, { color: t.fg }]}>{action} ›</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function EmptyState({ icon = 'heart', children }: { icon?: IconName; children: ReactNode }) {
  return (
    <View style={v2.empty}>
      <Ionicons name={icon} size={40} color={colors.pink} />
      <Body muted style={{ textAlign: 'center' }}>{children}</Body>
    </View>
  );
}

export function Avatar({ name, uri, size = 56 }: { name: string; uri?: string | null; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.blueSoft }} />;
  }
  const initial = name.replace(/^(Baby|Bébé|Dr|Pr)\s+/i, '').trim().slice(0, 1).toUpperCase() || '♥';
  return (
    <View style={[v2.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[v2.avatarText, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

/** Small coloured pill (status, tag). */
export function Pill({ label, tone = 'info', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const t = TONES[tone];
  return (
    <View style={[v2.pill, { backgroundColor: t.bg }]}>
      {icon ? <Ionicons name={icon} size={14} color={t.fg} /> : null}
      <Text style={[v2.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} style={({ pressed }) => [v2.row, pressed && { opacity: 0.7 }]}>
      {icon ? (
        <View style={v2.rowIcon}>
          <Ionicons name={icon} size={20} color={colors.blueDeep} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={v2.rowTitle}>{title}</Text>
        {subtitle ? <Body muted style={{ fontSize: 14 }}>{subtitle}</Body> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={20} color={colors.muted} /> : null)}
    </Pressable>
  );
}

/** Tappable checkbox row. */
export function CheckRow({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[v2.check, checked && { borderColor: colors.blue, backgroundColor: colors.blueSoft }]}
    >
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={26} color={colors.blueDeep} />
      <Text style={v2.checkText}>{label}</Text>
    </Pressable>
  );
}

/** Segmented single choice (small sets). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={v2.segment} accessibilityRole="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[v2.segmentItem, active && { backgroundColor: colors.blueDeep }]}
          >
            <Text style={[v2.segmentText, active && { color: colors.white }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const v2 = StyleSheet.create({
  banner: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, alignItems: 'flex-start' },
  bannerText: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  bannerAction: { fontFamily: fonts.extrabold, fontSize: 15 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  avatar: { backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.extrabold, color: colors.pinkDeep },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontFamily: fonts.bold, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, minHeight: 48 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  check: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', padding: spacing.md, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md },
  checkText: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, lineHeight: 22 },
  segment: { flexDirection: 'row', backgroundColor: colors.blueSoft, borderRadius: radius.pill, padding: 4, alignSelf: 'flex-start', flexWrap: 'wrap' },
  segmentItem: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, minHeight: 40, justifyContent: 'center' },
  segmentText: { fontFamily: fonts.bold, fontSize: 14, color: colors.blueDeep },
});
