import type { Reminder } from "@workspace/api-client-react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function getNotificationPermissionGranted(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

/**
 * Cancels all scheduled reminders and reschedules enabled ones as weekly
 * repeating local notifications. daysOfWeek uses 0=Sunday..6=Saturday;
 * expo-notifications WEEKLY weekday uses 1=Sunday..7=Saturday.
 */
export async function syncReminderNotifications(
  reminders: Reminder[],
): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const reminder of reminders) {
    if (!reminder.enabled) continue;
    const [hourStr, minuteStr] = reminder.timeOfDay.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) continue;

    const days =
      reminder.daysOfWeek && reminder.daysOfWeek.length > 0
        ? reminder.daysOfWeek
        : [0, 1, 2, 3, 4, 5, 6];

    for (const day of days) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "XBrainPro",
          body: reminder.title,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1,
          hour,
          minute,
        },
      });
    }
  }
}
