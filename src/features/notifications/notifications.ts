import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ApiClient } from '@/api/client';
import type { DrugChart } from '@/api/types';

/**
 * Push registration and on-device reminders (docs/05 §4). Local notifications work offline.
 * The web preview has no notifications, so everything here is a no-op on web.
 */
const supported = Platform.OS !== 'web';
const CHECK_TAG = 'check:';
const DOSE_TAG = 'dose:';
const RECHECK_TAG = 'recheck:';
const MAX_DOSE_ALARMS = 40;

export function configureNotifications() {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync('default', { name: 'NeoWell', importance: Notifications.AndroidImportance.HIGH });
  }
}

async function permitted(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Registers this device for server push (FR-ACC-05). Needs an EAS project id; silently skipped otherwise. */
export async function registerForPush(api: Pick<ApiClient, 'registerDevice'>) {
  try {
    if (!(await permitted())) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) return;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.registerDevice(token.data, Platform.OS);
  } catch {
    // Expo Go / no network: reminders still work locally.
  }
}

async function cancelTagged(prefix: string) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => String(n.content.data?.tag ?? '').startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Daily check reminders at each reminder time (FR-NOT-02). */
export async function scheduleCheckReminders(babies: { id: string; name: string; reminderTimes: string[] }[], text: (name: string) => { title: string; body: string }) {
  if (!(await permitted())) return;
  await cancelTagged(CHECK_TAG);
  for (const b of babies) {
    for (const time of b.reminderTimes) {
      const [hour, minute] = time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: { ...text(b.name), data: { tag: `${CHECK_TAG}${b.id}`, url: `/baby/${b.id}/check` } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    }
  }
}

/** One alarm at the recheck time (FR-CHK-08). */
export async function scheduleRecheck(babyId: string, recheckId: string, dueAt: string, content: { title: string; body: string }) {
  if (!(await permitted())) return;
  const date = new Date(dueAt);
  if (date.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    content: { ...content, data: { tag: `${RECHECK_TAG}${recheckId}`, url: `/baby/${babyId}/check?type=UNWELL&recheckOf=${recheckId}` } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

/** Upcoming dose times of a drug chart (local time), soonest first. */
export function upcomingDoses(chart: Pick<DrugChart, 'startDate' | 'items'>, now = new Date(), horizonDays = 7) {
  const start = new Date(chart.startDate);
  const doses: { itemId: string; at: Date; drugName: string; dose: string; route: string }[] = [];
  for (const item of chart.items) {
    const end = new Date(start.getTime() + item.durationDays * 86_400_000);
    for (let d = 0; d < Math.min(item.durationDays + 1, horizonDays + 1); d++) {
      for (const time of item.timesOfDay) {
        const [h, m] = time.split(':').map(Number);
        const day = new Date(Math.max(start.getTime(), now.getTime()));
        day.setHours(0, 0, 0, 0);
        const at = new Date(day.getTime() + d * 86_400_000 + (h * 60 + m) * 60_000);
        if (at > now && at >= start && at < end) doses.push({ itemId: item.id, at, drugName: item.drugName, dose: item.dose, route: item.route });
      }
    }
  }
  return doses.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Dose alarms for the next 7 days, refreshed on app start (FR-DRUG-02). */
export async function scheduleDoseAlarms(charts: (DrugChart & { babyName: string })[], text: (d: { drugName: string; dose: string; route: string; baby: string }) => { title: string; body: string }) {
  if (!(await permitted())) return;
  await cancelTagged(DOSE_TAG);
  const all = charts
    .filter((c) => c.active !== false)
    .flatMap((c) => upcomingDoses(c).map((d) => ({ ...d, chart: c })))
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_DOSE_ALARMS);
  for (const d of all) {
    await Notifications.scheduleNotificationAsync({
      content: { ...text({ ...d, baby: d.chart.babyName }), data: { tag: `${DOSE_TAG}${d.itemId}`, url: `/baby/${d.chart.babyId}/medicines` } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d.at },
    });
  }
}

/** Opens the screen a tapped notification points to. */
export function onNotificationTap(handler: (url: string) => void) {
  if (!supported) return () => undefined;
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const url = r.notification.request.content.data?.url;
    if (typeof url === 'string') handler(url);
  });
  return () => sub.remove();
}

/** Today's dose time for "HH:mm", as the ISO instant the API keys dose logs by. */
export function doseInstant(time: string, day = new Date()) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
