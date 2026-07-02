import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  createReminder,
  deleteReminder,
  getListRemindersQueryKey,
  updateReminder,
  useListReminders,
  type Reminder,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppHeader,
  Button,
  Card,
  Chip,
  EmptyView,
  Field,
  LoadingView,
} from "@/components/ui";
import colors, { fonts } from "@/constants/colors";
import {
  requestNotificationPermissions,
  syncReminderNotifications,
} from "@/lib/notifications";

const c = colors.light;
const DAY_LABELS = ["Rob", "Som", "Mongol", "Budh", "Brihoshpoti", "Shukro", "Shoni"];

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: reminders, isLoading, refetch } = useListReminders();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("08:00");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [saving, setSaving] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });

  // Keep native scheduled notifications in sync whenever the list changes.
  useEffect(() => {
    if (reminders) {
      syncReminderNotifications(reminders).catch(() => {});
    }
  }, [reminders]);

  const toggleDay = (d: number) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  };

  const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

  const save = async () => {
    if (!title.trim() || !validTime) return;
    setSaving(true);
    try {
      const granted = await requestNotificationPermissions();
      if (!granted && Platform.OS !== "web") {
        Alert.alert(
          "Notification bondho",
          "Reminder pete hole settings theke notification on korun.",
        );
      }
      await createReminder({
        title: title.trim(),
        timeOfDay: time,
        enabled: true,
        daysOfWeek: days.length ? days : [0, 1, 2, 3, 4, 5, 6],
      });
      await invalidate();
      setTitle("");
      setTime("08:00");
      setDays([0, 1, 2, 3, 4, 5, 6]);
      setShowForm(false);
    } catch {
      Alert.alert("Problem", "Reminder save korte parini.");
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (r: Reminder) => {
    try {
      await updateReminder(r.id, { enabled: !r.enabled });
      invalidate();
    } catch {
      Alert.alert("Problem", "Reminder update korte parini.");
    }
  };

  const remove = (r: Reminder) => {
    Alert.alert("Delete reminder?", r.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteReminder(r.id);
            invalidate();
          } catch {
            Alert.alert("Problem", "Reminder delete korte parini.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <AppHeader
        title="Reminders"
        subtitle="Kokhon mone koriye dibো"
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={() => setShowForm((s) => !s)}
            hitSlop={12}
            testID="add-reminder"
          >
            <Ionicons
              name={showForm ? "close" : "add"}
              size={26}
              color={c.primary}
            />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {showForm ? (
          <Card style={styles.form}>
            <Field
              placeholder="Reminder title (e.g. Morning routine)"
              value={title}
              onChangeText={setTitle}
              testID="reminder-title"
            />
            <View>
              <Text style={styles.formLabel}>Time (24h, HH:MM)</Text>
              <Field
                placeholder="08:00"
                value={time}
                onChangeText={setTime}
                keyboardType="numbers-and-punctuation"
                testID="reminder-time"
              />
              {!validTime && time.length > 0 ? (
                <Text style={styles.formHint}>Format: HH:MM (e.g. 07:30)</Text>
              ) : null}
            </View>
            <View>
              <Text style={styles.formLabel}>Din</Text>
              <View style={styles.dayWrap}>
                {DAY_LABELS.map((label, i) => (
                  <Chip
                    key={i}
                    label={label.slice(0, 3)}
                    selected={days.includes(i)}
                    onPress={() => toggleDay(i)}
                  />
                ))}
              </View>
            </View>
            <Button
              label="Save reminder"
              onPress={save}
              loading={saving}
              disabled={!title.trim() || !validTime}
              testID="save-reminder"
            />
          </Card>
        ) : null}

        {isLoading ? (
          <LoadingView />
        ) : !reminders || reminders.length === 0 ? (
          !showForm ? (
            <EmptyView
              icon="notifications-outline"
              title="Kono reminder nei"
              message="Roj kaj korar jonno reminder set korun."
              actionLabel="Reminder add korun"
              onAction={() => setShowForm(true)}
            />
          ) : null
        ) : (
          <View style={{ gap: 10, marginTop: showForm ? 16 : 0 }}>
            {reminders.map((r) => (
              <Card key={r.id} style={styles.reminderCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderTitle}>{r.title}</Text>
                  <Text style={styles.reminderMeta}>
                    {r.timeOfDay} ·{" "}
                    {r.daysOfWeek.length === 7
                      ? "Protidin"
                      : r.daysOfWeek
                          .map((d) => DAY_LABELS[d].slice(0, 3))
                          .join(", ")}
                  </Text>
                </View>
                <Switch
                  value={r.enabled}
                  onValueChange={() => toggleEnabled(r)}
                  trackColor={{ false: c.secondary, true: c.primary }}
                  thumbColor="#fff"
                />
                <Pressable
                  onPress={() => remove(r)}
                  hitSlop={10}
                  style={{ marginLeft: 4 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={c.mutedForeground}
                  />
                </Pressable>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.background },
  form: {
    gap: 14,
    marginBottom: 8,
  },
  formLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: c.mutedForeground,
    marginBottom: 8,
  },
  formHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: c.destructive,
    marginTop: 6,
  },
  dayWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reminderTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: c.foreground,
  },
  reminderMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: c.mutedForeground,
    marginTop: 3,
  },
});
