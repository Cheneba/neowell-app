import { Alert, Platform } from 'react-native';

/** Yes/no confirmation that also works in the web preview. */
export function confirm(title: string, message: string | undefined, labels: { ok: string; cancel: string }): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: labels.cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: labels.ok, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}
