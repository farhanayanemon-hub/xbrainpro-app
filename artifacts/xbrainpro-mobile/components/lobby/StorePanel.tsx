import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors, { fonts } from "@/constants/colors";
import { AVATARS, type AvatarDef } from "@/game/avatar";

const C = colors.dark;

type LookState = "equipped" | "owned" | "locked";

/**
 * Bottom sheet for the STORE district's Characters tab. Sits over the lower
 * portion of the lobby so the shared 3D hero above stays visible — tapping a
 * look drives that hero (live preview) before the player commits. Looks the
 * player hasn't unlocked show a LOCKED badge and an Unlock action; unlocked
 * looks can be equipped, which persists and carries into the city.
 */
const currencyIcon = (c: AvatarDef["priceCurrency"]): string =>
  c === "gems" ? "💎" : "🪙";

export default function StorePanel({
  selectedId,
  equippedId,
  ownedIds,
  coins,
  gems,
  busyId,
  notice,
  onPreview,
  onUnlock,
  onEquip,
  onClose,
}: {
  selectedId: string;
  equippedId: string;
  ownedIds: string[];
  coins: number;
  gems: number;
  busyId?: string | null;
  notice?: string | null;
  onPreview: (id: string) => void;
  onUnlock: (id: string) => void;
  onEquip: (id: string) => void;
  onClose: () => void;
}) {
  const owned = new Set(ownedIds);
  owned.add(equippedId); // the equipped look is always owned

  const stateOf = (a: AvatarDef): LookState =>
    a.id === equippedId ? "equipped" : owned.has(a.id) ? "owned" : "locked";

  const canAfford = (a: AvatarDef): boolean =>
    (a.priceCurrency === "gems" ? gems : coins) >= a.price;

  const selected = AVATARS.find((a) => a.id === selectedId) ?? AVATARS[0];
  const selectedState = stateOf(selected);
  const buying = busyId === selected.id;
  const affordable = canAfford(selected);

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🛍️ STORE</Text>
          <Text style={styles.subtitle}>Characters — switch your look</Text>
        </View>
        <View style={styles.balanceRow}>
          <View style={styles.balancePill}>
            <Text style={styles.balanceText}>🪙 {coins}</Text>
          </View>
          <View style={styles.balancePill}>
            <Text style={styles.balanceText}>💎 {gems}</Text>
          </View>
        </View>
        <Pressable style={styles.close} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {AVATARS.map((a) => {
          const s = stateOf(a);
          const active = a.id === selectedId;
          return (
            <Pressable
              key={a.id}
              onPress={() => onPreview(a.id)}
              style={[
                styles.card,
                active && { borderColor: a.color, borderWidth: 2 },
              ]}
            >
              <View style={[styles.swatch, { backgroundColor: a.color }]}>
                <Text style={styles.swatchInitial}>{a.name.charAt(0)}</Text>
                {s === "locked" && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockIcon}>🔒</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardName} numberOfLines={1}>
                {a.name}
              </Text>
              <Text style={styles.cardTagline} numberOfLines={1}>
                {a.tagline}
              </Text>
              <View
                style={[
                  styles.badge,
                  s === "equipped" && styles.badgeEquipped,
                  s === "locked" && styles.badgeLocked,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    s === "equipped" && styles.badgeTextEquipped,
                  ]}
                >
                  {s === "equipped"
                    ? "EQUIPPED"
                    : s === "owned"
                      ? "OWNED"
                      : `${currencyIcon(a.priceCurrency)} ${a.price}`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {notice ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerName}>{selected.name}</Text>
        {selectedState === "equipped" ? (
          <View style={[styles.action, styles.actionDisabled]}>
            <Text style={styles.actionText}>EQUIPPED</Text>
          </View>
        ) : selectedState === "owned" ? (
          <Pressable
            style={[styles.action, { backgroundColor: C.primary }]}
            onPress={() => onEquip(selected.id)}
          >
            <Text style={styles.actionText}>EQUIP</Text>
          </Pressable>
        ) : buying ? (
          <View style={[styles.action, styles.actionDisabled]}>
            <Text style={styles.actionText}>BUYING…</Text>
          </View>
        ) : affordable ? (
          <Pressable
            style={[styles.action, { backgroundColor: selected.color }]}
            onPress={() => onUnlock(selected.id)}
          >
            <Text style={styles.actionText}>
              🔓 {selected.price} {currencyIcon(selected.priceCurrency)}
            </Text>
          </Pressable>
        ) : (
          <View style={[styles.action, styles.actionDisabled]}>
            <Text style={styles.actionText}>
              NEED {currencyIcon(selected.priceCurrency)} {selected.price}
            </Text>
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
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 17,
    letterSpacing: 3,
    color: "#fff",
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: C.mutedForeground,
    marginTop: 2,
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

  balanceRow: { flexDirection: "row", gap: 6, marginLeft: "auto", marginRight: 8 },
  balancePill: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  balanceText: { fontFamily: fonts.bold, fontSize: 12, color: "#fff" },

  notice: {
    marginTop: 12,
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

  row: { gap: 12, paddingRight: 6, paddingBottom: 4 },
  card: {
    width: 120,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  swatchInitial: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: "rgba(10,12,30,0.85)",
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,8,20,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: { fontSize: 20 },
  cardName: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
  },
  cardTagline: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.mutedForeground,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 8,
  },
  badge: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  badgeEquipped: {
    backgroundColor: C.primary,
    borderColor: C.primaryBorder,
  },
  badgeLocked: {
    backgroundColor: "rgba(6,8,20,0.5)",
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 8.5,
    letterSpacing: 1,
    color: C.mutedForeground,
  },
  badgeTextEquipped: { color: "#fff" },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  footerName: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: "#fff",
  },
  action: {
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDisabled: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  actionText: {
    fontFamily: fonts.heading,
    fontSize: 15,
    letterSpacing: 2,
    color: "#fff",
  },
});
