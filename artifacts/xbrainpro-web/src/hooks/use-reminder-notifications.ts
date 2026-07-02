import { useEffect, useState, useCallback } from "react";
import { useListReminders } from "@workspace/api-client-react";

type Permission = "default" | "granted" | "denied" | "unsupported";

function currentPermission(): Permission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as Permission;
}

// Module-level state shared across every hook instance so that (a) only one
// scheduler loop ever runs and (b) permission changes made on one page are
// reflected everywhere.
const firedKeys = new Set<string>();
const listeners = new Set<(p: Permission) => void>();

function broadcastPermission(p: Permission) {
  listeners.forEach((l) => l(p));
}

/**
 * Read-only access to notification permission plus a request helper. Safe to
 * mount in multiple components — it never starts a scheduling loop.
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<Permission>(currentPermission);

  useEffect(() => {
    const listener = (p: Permission) => setPermission(p);
    listeners.add(listener);
    // Re-sync in case permission changed while unmounted.
    setPermission(currentPermission());
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      broadcastPermission("unsupported");
      return "unsupported" as Permission;
    }
    const result = (await Notification.requestPermission()) as Permission;
    broadcastPermission(result);
    return result;
  }, []);

  return { permission, requestPermission };
}

/**
 * Schedules browser notifications for the user's enabled reminders while the
 * app is open. Mount this exactly once (in the authenticated layout). It checks
 * once a minute and reads live permission each tick, so granting permission on
 * any page takes effect without a remount. Each reminder fires at most once per
 * day on the weekdays it is active for.
 */
export function useReminderNotifications() {
  const { data: reminders } = useListReminders();
  const permissionApi = useNotificationPermission();

  useEffect(() => {
    if (!reminders || reminders.length === 0) return;

    const check = () => {
      if (currentPermission() !== "granted") return;

      const now = new Date();
      const day = now.getDay();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const nowHm = `${hh}:${mm}`;
      const dateKey = now.toISOString().slice(0, 10);

      for (const r of reminders) {
        if (!r.enabled) continue;
        if (!r.daysOfWeek.includes(day)) continue;
        // reminder.timeOfDay is stored as HH:MM.
        if (r.timeOfDay.slice(0, 5) !== nowHm) continue;

        const key = `${r.id}@${dateKey}@${nowHm}`;
        if (firedKeys.has(key)) continue;
        firedKeys.add(key);

        try {
          new Notification("XBrainPro", {
            body: `${r.timeOfDay} — ${r.title}`,
            tag: `xbp-reminder-${r.id}`,
          });
        } catch {
          // Ignore notification construction errors (e.g. unsupported options).
        }
      }
    };

    check();
    const interval = window.setInterval(check, 60 * 1000);
    return () => window.clearInterval(interval);
  }, [reminders]);

  return permissionApi;
}
