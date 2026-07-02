import { Ionicons } from "@expo/vector-icons";
import {
  getGetDashboardQueryKey,
  getGetProgressQueryKey,
  getGetTodayTasksQueryKey,
  useCompleteTask,
  useGetDashboard,
  useUncompleteTask,
  type Task,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppHeader,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  ProgressBar,
  SectionTitle,
  StatCard,
} from "@/components/ui";
import colors, { fonts } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const c = colors.light;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Shubho shokal";
  if (h < 17) return "Shubho dupur";
  return "Shubho shondha";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useGetDashboard();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTodayTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey() });
  };

  const complete = useCompleteTask({
    mutation: {
      onSuccess: () => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        invalidate();
      },
    },
  });
  const uncomplete = useUncompleteTask({ mutation: { onSuccess: invalidate } });

  const toggleTask = (task: Task) => {
    if (task.completed) {
      uncomplete.mutate({ id: task.id });
    } else {
      complete.mutate({ id: task.id });
    }
  };

  const bottomPad = insets.bottom + 100;

  if (isLoading) {
    return (
      <View style={styles.flex}>
        <AppHeader title={greeting()} subtitle={user?.name} />
        <LoadingView />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.flex}>
        <AppHeader title={greeting()} subtitle={user?.name} />
        <ErrorView onRetry={refetch} />
      </View>
    );
  }

  const tasks = data.todayTasks ?? [];
  const progressPct =
    data.todayTotal > 0
      ? Math.round((data.todayCompleted / data.todayTotal) * 100)
      : 0;

  return (
    <View style={styles.flex}>
      <AppHeader title={greeting()} subtitle={user?.name} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={c.primary}
          />
        }
      >
        {data.quote ? (
          <Card style={styles.quoteCard}>
            <Ionicons name="sparkles" size={16} color={c.primary} />
            <Text style={styles.quoteText}>{data.quote}</Text>
          </Card>
        ) : null}

        <View style={styles.statsRow}>
          <StatCard icon="ribbon" value={data.level} label="Level" />
          <StatCard
            icon="flame"
            value={data.streak}
            label="Din streak"
            accent="#f59e0b"
          />
          <StatCard
            icon="flash"
            value={data.xp}
            label="XP"
            accent="#10b981"
          />
        </View>

        {data.program ? (
          <Card style={styles.programCard}>
            <View style={styles.programTop}>
              <Text style={styles.programTitle} numberOfLines={1}>
                {data.program.pathTitle}
              </Text>
              <Text style={styles.programPct}>{data.program.progressPct}%</Text>
            </View>
            <ProgressBar
              value={data.program.progressPct}
              color={data.program.accent ?? c.primary}
            />
            <Text style={styles.programMeta}>
              Level {data.program.currentLevel} / {data.program.totalLevels}
              {data.nextLevelTitle ? ` · Next: ${data.nextLevelTitle}` : ""}
            </Text>
          </Card>
        ) : null}

        <View style={styles.todayHeader}>
          <SectionTitle>Aj ker kaj</SectionTitle>
          <Text style={styles.todayCount}>
            {data.todayCompleted}/{data.todayTotal}
          </Text>
        </View>
        {data.todayTotal > 0 ? (
          <View style={{ marginBottom: 12 }}>
            <ProgressBar value={progressPct} />
          </View>
        ) : null}

        {tasks.length === 0 ? (
          <EmptyView
            icon="checkmark-done-outline"
            title="Aj ker kono kaj nei"
            message="Notun kaj shigroi ashbe. Bishram nin!"
          />
        ) : (
          <View style={{ gap: 10 }}>
            {tasks.map((task) => (
              <Pressable key={task.id} onPress={() => toggleTask(task)}>
                <Card style={styles.taskCard}>
                  <View
                    style={[
                      styles.checkbox,
                      task.completed
                        ? { backgroundColor: c.primary, borderColor: c.primary }
                        : null,
                    ]}
                  >
                    {task.completed ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.taskTitle,
                        task.completed ? styles.taskDone : null,
                      ]}
                    >
                      {task.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      {task.timeOfDay ? (
                        <View style={styles.metaPill}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={c.mutedForeground}
                          />
                          <Text style={styles.metaText}>{task.timeOfDay}</Text>
                        </View>
                      ) : null}
                      {task.durationMinutes ? (
                        <View style={styles.metaPill}>
                          <Ionicons
                            name="hourglass-outline"
                            size={12}
                            color={c.mutedForeground}
                          />
                          <Text style={styles.metaText}>
                            {task.durationMinutes} min
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.metaPill}>
                        <Ionicons name="flash" size={12} color="#10b981" />
                        <Text style={styles.metaText}>{task.xp} XP</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.background },
  quoteCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  quoteText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: c.foreground,
    lineHeight: 20,
    fontStyle: "italic",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  programCard: {
    gap: 10,
    marginBottom: 20,
  },
  programTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  programTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: c.foreground,
    flex: 1,
  },
  programPct: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: c.primary,
  },
  programMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: c.mutedForeground,
  },
  todayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  todayCount: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: c.mutedForeground,
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  taskTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: c.foreground,
  },
  taskDone: {
    textDecorationLine: "line-through",
    color: c.mutedForeground,
  },
  taskMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: c.mutedForeground,
  },
});
