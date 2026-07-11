import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors, { fonts } from "@/constants/colors";
import type { DailyState, DailyTask } from "@/lib/dailyTasks";

const C = colors.dark;

const rewardIcon = (currency: string): string =>
  currency === "gems" ? "💎" : "🪙";

/**
 * Bottom sheet listing today's Daily Tasks. Each task shows live progress and,
 * once complete, a Claim button that pays the reward into the player's wallet.
 * A login-streak chip up top rewards returning every day (the check-in reward
 * scales with the streak). Mirrors the StorePanel sheet styling.
 */
export default function DailyTasksPanel({
  state,
  loading,
  claimingId,
  notice,
  onClaim,
  onClose,
}: {
  state: DailyState | null;
  loading: boolean;
  claimingId?: string | null;
  notice?: string | null;
  onClaim: (taskId: string) => void;
  onClose: () => void;
}) {
  const readyToClaim =
    state?.tasks.filter((t) => t.completed && !t.claimed).length ?? 0;

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>✅ DAILY TASKS</Text>
          <Text style={styles.subtitle}>
            {readyToClaim > 0
              ? `${readyToClaim} reward${readyToClaim > 1 ? "s" : ""} ready to claim`
              : "Come back daily for more"}
          </Text>
        </View>
        <View style={styles.streakChip}>
          <Text style={styles.streakText}>🔥 {state?.streak ?? 0}</Text>
          <Text style={styles.streakLabel}>DAY STREAK</Text>
        </View>
        <Pressable style={styles.close} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      {notice ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      {loading && !state ? (
        <View style={styles.loading}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
        >
          {state?.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              busy={claimingId === task.id}
              onClaim={() => onClaim(task.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function TaskRow({
  task,
  busy,
  onClaim,
}: {
  task: DailyTask;
  busy: boolean;
  onClaim: () => void;
}) {
  const pct = Math.min(100, Math.round((task.progress / task.goal) * 100));
  const claimable = task.completed && !task.claimed;

  return (
    <View style={[styles.row, task.claimed && styles.rowDone]}>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {task.title}
        </Text>
        <Text style={styles.rowDesc} numberOfLines={1}>
          {task.description}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${pct}%` },
              task.completed && { backgroundColor: C.primary },
            ]}
          />
        </View>
        <Text style={styles.rowMeta}>
          {task.progress}/{task.goal} · reward {rewardIcon(task.rewardCurrency)}{" "}
          {task.rewardAmount}
        </Text>
      </View>

      {task.claimed ? (
        <View style={[styles.claimBtn, styles.claimedBtn]}>
          <Text style={styles.claimedText}>CLAIMED</Text>
        </View>
      ) : claimable ? (
        <Pressable
          style={[styles.claimBtn, busy && styles.claimBtnBusy]}
          disabled={busy}
          onPress={onClaim}
        >
          <Text style={styles.claimText}>{busy ? "…" : "CLAIM"}</Text>
        </Pressable>
      ) : (
        <View style={[styles.claimBtn, styles.lockedBtn]}>
          <Text style={styles.lockedText}>
            {rewardIcon(task.rewardCurrency)} {task.rewardAmount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "72%",
    backgroundColor: "rgba(12,15,34,0.97)",
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 17,
    letterSpacing: 2,
    color: "#fff",
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: C.mutedForeground,
    marginTop: 2,
  },
  streakChip: {
    marginLeft: "auto",
    marginRight: 8,
    alignItems: "center",
    backgroundColor: "rgba(255,92,138,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,92,138,0.4)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  streakText: { fontFamily: fonts.bold, fontSize: 15, color: "#fff" },
  streakLabel: {
    fontFamily: fonts.bold,
    fontSize: 7.5,
    letterSpacing: 1,
    color: C.mutedForeground,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.secondary,
    borderWidth: 1,
    borderColor: C.border,
  },
  closeText: { fontSize: 15, color: C.mutedForeground },

  notice: {
    marginBottom: 10,
    backgroundColor: "rgba(139,92,246,0.16)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.42)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noticeText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: "#d7c7ff",
    textAlign: "center",
  },

  loading: { paddingVertical: 40, alignItems: "center" },
  list: { flexGrow: 0 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 12,
  },
  rowDone: { opacity: 0.6 },
  rowMain: { flex: 1 },
  rowTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: "#fff",
  },
  rowDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.mutedForeground,
    marginTop: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: C.accent,
  },
  rowMeta: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: C.mutedForeground,
    marginTop: 6,
  },

  claimBtn: {
    minWidth: 82,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
  },
  claimBtnBusy: { opacity: 0.7 },
  claimText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    letterSpacing: 1.5,
    color: "#fff",
  },
  claimedBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  claimedText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    letterSpacing: 1,
    color: C.mutedForeground,
  },
  lockedBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  lockedText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: C.mutedForeground,
  },
});
