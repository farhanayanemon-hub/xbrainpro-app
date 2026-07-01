import { Ionicons } from "@expo/vector-icons";
import { useGetProgress, type Badge } from "@workspace/api-client-react";
import React from "react";
import {
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
  ErrorView,
  LoadingView,
  SectionTitle,
  StatCard,
} from "@/components/ui";
import colors, { fonts } from "@/constants/colors";

const c = colors.light;

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch, isRefetching } = useGetProgress();

  if (isLoading) {
    return (
      <View style={styles.flex}>
        <AppHeader title="Progress" />
        <LoadingView />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.flex}>
        <AppHeader title="Progress" />
        <ErrorView onRetry={refetch} />
      </View>
    );
  }

  const maxActivity = Math.max(
    1,
    ...data.weeklyActivity.map((d) => d.completed),
  );
  const earnedBadges = data.badges.filter((b) => b.earned);
  const lockedBadges = data.badges.filter((b) => !b.earned);

  return (
    <View style={styles.flex}>
      <AppHeader title="Progress" subtitle="Apnar journey ekhon porjonto" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={c.primary}
          />
        }
      >
        <View style={styles.statsRow}>
          <StatCard
            icon="flame"
            value={data.streak}
            label="Ekhon streak"
            accent="#f59e0b"
          />
          <StatCard
            icon="trophy"
            value={data.longestStreak}
            label="Longest"
            accent="#e0b341"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            icon="checkmark-done"
            value={data.totalTasksCompleted}
            label="Kaj shesh"
            accent="#10b981"
          />
          <StatCard
            icon="pie-chart"
            value={`${data.completionRate}%`}
            label="Completion"
          />
        </View>

        <SectionTitle>Ei shopta</SectionTitle>
        <Card style={styles.chartCard}>
          <View style={styles.chart}>
            {data.weeklyActivity.map((day, i) => {
              const h = 12 + (day.completed / maxActivity) * 90;
              const d = new Date(day.date);
              return (
                <View key={day.date} style={styles.barCol}>
                  <Text style={styles.barValue}>
                    {day.completed > 0 ? day.completed : ""}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: h,
                        backgroundColor:
                          day.completed > 0 ? c.primary : c.secondary,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>
                    {DAY_LABELS[d.getDay()]}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        <View style={{ marginTop: 24 }}>
          <SectionTitle>Badges</SectionTitle>
          {data.badges.length === 0 ? (
            <Text style={styles.emptyText}>Kono badge nei এখনো.</Text>
          ) : (
            <View style={styles.badgeGrid}>
              {[...earnedBadges, ...lockedBadges].map((badge) => (
                <BadgeCard key={badge.key} badge={badge} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <Card
      style={[
        styles.badgeCard,
        !badge.earned ? { opacity: 0.45 } : null,
      ]}
    >
      <View
        style={[
          styles.badgeIcon,
          {
            backgroundColor: badge.earned ? "#e0b34122" : c.secondary,
          },
        ]}
      >
        <Ionicons
          name={badge.earned ? "trophy" : "lock-closed"}
          size={22}
          color={badge.earned ? "#e0b341" : c.mutedForeground}
        />
      </View>
      <Text style={styles.badgeTitle} numberOfLines={1}>
        {badge.title}
      </Text>
      <Text style={styles.badgeDesc} numberOfLines={2}>
        {badge.description}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.background },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  chartCard: {
    marginBottom: 4,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  barValue: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: c.mutedForeground,
    height: 14,
  },
  bar: {
    width: 22,
    borderRadius: 6,
  },
  barLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: c.mutedForeground,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    width: "47.5%",
    gap: 8,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: c.foreground,
  },
  badgeDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: c.mutedForeground,
    lineHeight: 16,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: c.mutedForeground,
  },
});
