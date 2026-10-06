import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type Locale, useI18n } from '@/i18n';
import { colors, fonts, radius } from '@/theme';

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

export function LanguageSwitch({ onChange }: { onChange?: (l: Locale) => void } = {}) {
  const { locale, setLocale } = useI18n();
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {LOCALES.map((l) => {
        const active = l.value === locale;
        return (
          <Pressable
            key={l.value}
            onPress={() => {
              setLocale(l.value);
              onChange?.(l.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[styles.item, active && styles.active]}
          >
            <Text style={[styles.text, active && { color: colors.white }]}>{l.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.blueSoft,
    borderRadius: radius.pill,
    padding: 4,
  },
  item: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, minHeight: 40, justifyContent: 'center' },
  active: { backgroundColor: colors.blueDeep },
  text: { fontFamily: fonts.bold, fontSize: 14, color: colors.blueDeep },
});
