import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import colors, { fonts } from "@/constants/colors";

export default function PauseMenu({
  onResume,
  onChangeAvatar,
}: {
  onResume: () => void;
  onChangeAvatar: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onResume}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.spark}>✦</Text>
          <Text style={styles.title}>NEURA CITY</Text>
          <Text style={styles.subtitle}>Paused</Text>

          <View style={styles.tips}>
            <Text style={styles.tip}>• Drag the joystick to walk around</Text>
            <Text style={styles.tip}>• Walk up to a glowing citizen to talk</Text>
            <Text style={styles.tip}>• Every citizen is a living AI — ask anything</Text>
          </View>

          <Pressable style={styles.resumeBtn} onPress={onResume}>
            <Text style={styles.resumeText}>Resume</Text>
          </Pressable>
          <Pressable style={styles.avatarBtn} onPress={onChangeAvatar}>
            <Text style={styles.avatarText}>Change avatar</Text>
          </Pressable>
          <Text style={styles.version}>Phase 1 • Plaza District</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(6,8,20,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "rgba(24,29,56,0.98)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 28,
    alignItems: "center",
  },
  spark: { color: colors.dark.primary, fontSize: 22, marginBottom: 6 },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    letterSpacing: 4,
    color: "#fff",
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.dark.mutedForeground,
    marginTop: 4,
    marginBottom: 20,
  },
  tips: { alignSelf: "stretch", gap: 8, marginBottom: 24 },
  tip: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.85)",
  },
  resumeBtn: {
    alignSelf: "stretch",
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  resumeText: { fontFamily: fonts.headingSemi, fontSize: 16, color: "#fff" },
  avatarBtn: {
    alignSelf: "stretch",
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  avatarText: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
  },
  version: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.dark.mutedForeground,
    marginTop: 16,
  },
});
