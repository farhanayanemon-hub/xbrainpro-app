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
import { formatVipRemaining, type VipStatus } from "@/lib/vip";

const C = colors.dark;
const GOLD = "#ffd45e";

/**
 * Bottom sheet for VIP membership. Explains the perks, shows the player's live
 * status (active with time left, or the offer to join), and lets them become
 * VIP by spending gems. Mirrors the StorePanel / DailyTasksPanel sheet styling.
 * Perks are server-authoritative and switch off on expiry, so this sheet only
 * ever reflects what the server says.
 */
export default function VipPanel({
  status,
  gems,
  loading,
  buying,
  notice,
  onBuy,
  onClose,
}: {
  status: VipStatus | null;
  gems: number;
  loading: boolean;
  buying: boolean;
  notice?: string | null;
  onBuy: () => void;
  onClose: () => void;
}) {
  const active = status?.active ?? false;
  const remaining = status ? formatVipRemaining(status.expiresAt) : null;
  const cost = status?.costGems ?? 0;
  const bonus = status?.dailyBonusPct ?? 0;
  const days = status?.durationDays ?? 0;
  const affordable = gems >= cost;

  const perks = [
    { icon: "📈", title: `+${bonus}% Daily Rewards`, desc: "Bigger payouts on every daily task" },
    { icon: "👑", title: "VIP Badge", desc: "A gold crown on your name & profile" },
  ];

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>👑 VIP</Text>
          <Text style={styles.subtitle}>
            {active ? `Active · ${remaining ?? "expiring…"}` : "Unlock exclusive perks"}
          </Text>
        </View>
        <View style={styles.balancePill}>
          <Text style={styles.balanceText}>💎 {gems}</Text>
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

      {loading && !status ? (
        <View style={styles.loading}>
          <ActivityIndicator color={GOLD} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
        >
          {active && (
            <View style={styles.activeBanner}>
              <Text style={styles.activeCrown}>👑</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeTitle}>You're a VIP</Text>
                <Text style={styles.activeSub}>{remaining ?? "expiring soon"}</Text>
              </View>
            </View>
          )}

          {perks.map((p) => (
            <View key={p.title} style={styles.perkRow}>
              <Text style={styles.perkIcon}>{p.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.perkTitle}>{p.title}</Text>
                <Text style={styles.perkDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}

          <Text style={styles.terms}>
            {days}-day membership. Buying again adds another {days} days on top.
          </Text>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>
          {active ? "EXTEND MEMBERSHIP" : "BECOME VIP"}
        </Text>
        {!status ? (
          // Never expose a purchase CTA (or a bogus 0-gem cost) before the
          // server's real terms arrive.
          <View style={[styles.action, styles.actionDisabled]}>
            <Text style={styles.actionText}>LOADING…</Text>
          </View>
        ) : buying ? (
          <View style={[styles.action, styles.actionDisabled]}>
            <Text style={styles.actionText}>BUYING…</Text>
          </View>
        ) : affordable ? (
          <Pressable style={styles.action} onPress={onBuy}>
            <Text style={styles.actionText}>
              💎 {cost} · {active ? "+30 DAYS" : "JOIN"}
            </Text>
          </Pressable>
        ) : (
          <View style={[styles.action, styles.actionDisabled]}>
            <Text style={styles.actionText}>NEED 💎 {cost}</Text>
          </View>
        )}
      </View>
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
    borderTopColor: "rgba(255,212,94,0.4)",
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
    color: GOLD,
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

  notice: {
    marginBottom: 10,
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

  loading: { paddingVertical: 40, alignItems: "center" },
  list: { flexGrow: 0 },

  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,212,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,212,94,0.45)",
    borderRadius: 14,
    padding: 12,
  },
  activeCrown: { fontSize: 26 },
  activeTitle: { fontFamily: fonts.headingSemi, fontSize: 15, color: GOLD },
  activeSub: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: C.mutedForeground,
    marginTop: 1,
  },

  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 12,
  },
  perkIcon: { fontSize: 22 },
  perkTitle: { fontFamily: fonts.headingSemi, fontSize: 14, color: "#fff" },
  perkDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.mutedForeground,
    marginTop: 1,
  },
  terms: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: C.mutedForeground,
    textAlign: "center",
    marginTop: 4,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  footerLabel: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    letterSpacing: 1,
    color: "#fff",
  },
  action: {
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD,
  },
  actionDisabled: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  actionText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 1.5,
    color: "#1a1400",
  },
});
