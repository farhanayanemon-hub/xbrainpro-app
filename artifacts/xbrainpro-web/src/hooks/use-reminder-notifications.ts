import { useEffect, useRef, useState, useCallback } from "react";
import { useListReminders } from "@workspace/api-client-react";

type Permission = "default" | "granted" | "denied" | "unsupported";

function currentPermission(): Permission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as Permission;
}

/**
 * Schedules browser notifications for the user's enabled reminders while the
 * app is open. Checks once a minute; each reminder fires at most once per day
 * on the weekdays it is active for. Falls back gracefully where the
 * Notification API is unavailable or permission is denied.
 */
export function useReminderNotifications() {
  const { data: reminders } = useListReminders();
  const [permission, setPermission] = useState<Permission>(currentPermission);
  // Tracks "reminderId@YYYY-MM-DD@HH:MM" keys already fired this session.
  const firedRef = useRef<Set<string>>(new Set());

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return "unsupported" as Permission;
    }
    const result = await Notification.requestPermission();
    setPermission(result as Permission);
    return result as Permission;
  }, []);

  useEffect(() => {
    if (permission !== "granted") return;
    if (!reminders || reminders.length === 0) return;

    const check = () => {
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
        if (firedRef.current.has(key)) continue;
        firedRef.current.add(key);

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
  }, [permission, reminders]);

  return { permission, requestPermission };
}
