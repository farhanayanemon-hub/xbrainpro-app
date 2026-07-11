import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors, { fonts } from "@/constants/colors";
import { AVATARS } from "@/game/avatar";
import type { MysteryBoxInfo, MysteryReward } from "@/lib/mysteryBox";

const C = colors.dark;

function rewardLabel(r: MysteryReward): { icon: string; label: string } {
  if (r.type === "avatar") {
    const look = AVATARS.find((a) => a.id === r.avatarId);
    return { icon: "🧍", label: look ? `${look.name} look` : "New look" };
  }
  return { icon: r.type === "gems" ? "💎" : "🪙", label: `${r.amount}` };
}

/**
 * Bottom sheet for the Mystery Box. Spend gems to open; the server rolls a
 * weighted random reward and the reveal animates in. Currency lands in the
 * wallet immediately; a look reward is unlocked in the Store. The possible
 * rewards are shown as chips so the player knows what's inside.
 */
export default function MysteryBoxPanel({
  info,
  gems,
  opening,
  reward,
  notice,
  onOpen,
  onClose,
}: {
  info: MysteryBoxInfo | null;
  gems: number;
  opening: boolean;
  reward: MysteryReward | null;
  notice?: string | null;
  onOpen: () => void;
  onClose: () => void;
}) {
  const cost = info?.cost ?? 0;
  const affordable = gems >= cost;

  // Idle bob for the box; reveal pop when a reward arrives.
  const bob = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  useEffect(() => {
    if (reward) {
      pop.setValue(0);
      Animated.spring(pop, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 12,
      }).start();
    }
  }, [reward, pop]);

  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  const uniqueRewards = dedupeRewards(info?.pool ?? []);

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🎁 MYSTERY BOX</Text>
          <Text style={styles.subtitle}>Spend gems for a random prize</Text>
        </View>
        <View style={styles.balancePill}>
          <Text style={styles.balanceText}>💎 {gems}</Text>
        </View>
        <Pressable style={styles.close} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.stage}>
        {reward ? (
          <Animated.View style={[styles.revealBox, { transform: [{ scale: popScale }] }]}>
            <Text style={styles.revealIcon}>{rewardLabel(reward).icon}</Text>
            <Text style={styles.revealLabel}>YOU GOT</Text>
            <Text style={styles.revealValue}>{rewardLabel(reward).label}</Text>
          </Animated.View>
        ) : (
          <Animated.Text style={[styles.boxEmoji, { transform: [{ translateY: bobY }] }]}>
            🎁
          </Animated.Text>
        )}
      </View>

      {notice ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <Text style={styles.poolHeading}>POSSIBLE REWARDS</Text>
      <View style={styles.poolRow}>
        {uniqueRewards.map((r, i) => {
          const { icon, label } = rewardLabel(r);
          return (
            <View key={i} style={styles.poolChip}>
              <Text style={styles.poolChipText}>
                {icon} {label}
              </Text>
            </View>
          );
        })}
      </View>

      {affordable ? (
        <Pressable
          style={[styles.openBtn, opening && styles.openBtnBusy]}
          disabled={opening}
          onPress={onOpen}
        >
          <Text style={styles.openText}>
            {opening ? "OPENING…" : reward ? `OPEN AGAIN · 💎 ${cost}` : `OPEN · 💎 ${cost}`}
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.openBtn, styles.openBtnDisabled]}>
          <Text style={styles.openText}>NEED 💎 {cost}</Text>
        </View>
      )}
    </View>
  );
}

/** Collapse duplicate reward shapes so the chip row stays compact. */
function dedupeRewards(pool: MysteryReward[]): MysteryReward[] {
  const seen = new Set<string>();
  const out: MysteryReward[] = [];
  for (const r of pool) {
    const key = r.type === "avatar" ? `avatar:${r.avatarId}` : `${r.type}:${r.amount}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
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
    marginBottom: 8,
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
  balancePill: {
    marginLeft: "auto",
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  balanceText: { fontFamily: fonts.bold, fontSize: 12, color: "#fff" },
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

  stage: {
    height: 128,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  boxEmoji: { fontSize: 72 },
  revealBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.14)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.5)",
    borderRadius: 18,
    paddingHorizontal: 30,
    paddingVertical: 14,
  },
  revealIcon: { fontSize: 40 },
  revealLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 2,
    color: C.mutedForeground,
    marginTop: 4,
  },
  revealValue: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: "#fff",
    marginTop: 2,
  },

  notice: {
    marginBottom: 8,
    backgroundColor: "rgba(255,90,90,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,90,90,0.4)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noticeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#ffb4b4",
    textAlign: "center",
  },

  poolHeading: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 2,
    color: C.mutedForeground,
    marginBottom: 8,
  },
  poolRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 14,
  },
  poolChip: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  poolChipText: { fontFamily: fonts.semibold, fontSize: 11, color: "#e6e8ff" },

  openBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.accent,
  },
  openBtnBusy: { opacity: 0.7 },
  openBtnDisabled: { backgroundColor: "rgba(255,255,255,0.08)" },
  openText: {
    fontFamily: fonts.heading,
    fontSize: 15,
    letterSpacing: 1.5,
    color: "#fff",
  },
});
