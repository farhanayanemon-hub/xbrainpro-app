import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts } from "@/constants/colors";
import type { NpcDef } from "@/game/npcs";

export default function Hud({
  nearNpc,
  onTalk,
  onPause,
}: {
  nearNpc: NpcDef | null;
  onTalk: () => void;
  onPause: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <>
      {/* Top HUD */}
      <View style={[styles.top, { paddingTop: insets.top + 14 }]}>
        <View style={styles.playerChip}>
          <View style={styles.playerAvatar}>
            <Text style={styles.playerAvatarText}>Y</Text>
          </View>
          <View>
            <Text style={styles.playerName}>You</Text>
            <Text style={styles.playerLoc}>NEURA CITY • PLAZA</Text>
          </View>
        </View>
        <Pressable style={styles.iconBtn} onPress={onPause} hitSlop={6}>
          <Text style={styles.iconText}>⚙︎</Text>
        </Pressable>
      </View>

      {/* Talk prompt pill */}
      {nearNpc && (
        <View style={styles.promptWrap} pointerEvents="none">
          <View style={[styles.promptPill, { borderColor: nearNpc.accent }]}>
            <Text style={[styles.promptSpark, { color: nearNpc.accent }]}>✦</Text>
            <Text style={styles.promptText}>
              {nearNpc.name} — {nearNpc.title.split("•")[0].trim()}
            </Text>
          </View>
        </View>
      )}

      {/* Talk action button */}
      {nearNpc && (
        <Pressable
          style={[
            styles.talkBtn,
            {
              backgroundColor: nearNpc.accent,
              bottom: 60 + insets.bottom,
              shadowColor: nearNpc.accent,
            },
          ]}
          onPress={onTalk}
        >
          <Text style={styles.talkIcon}>💬</Text>
          <Text style={styles.talkText}>TALK</Text>
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 18,
  },
  playerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(16,20,42,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    padding: 5,
    paddingRight: 16,
  },
  playerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#8b5cf6",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  playerAvatarText: { fontFamily: fonts.heading, fontSize: 16, color: "#fff" },
  playerName: { fontFamily: fonts.bold, fontSize: 13, color: "#fff" },
  playerLoc: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 1.1,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(16,20,42,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: "#fff", fontSize: 18 },
  promptWrap: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  promptPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(16,20,42,0.7)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  promptSpark: { fontSize: 12 },
  promptText: { fontFamily: fonts.semibold, fontSize: 13, color: "#fff" },
  talkBtn: {
    position: "absolute",
    right: 26,
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  talkIcon: { fontSize: 20 },
  talkText: {
    fontFamily: fonts.heading,
    fontSize: 11,
    letterSpacing: 1.5,
    color: "#fff",
    marginTop: 2,
  },
});
