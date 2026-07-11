import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import colors, { fonts } from "@/constants/colors";
import { GENDER_AVATAR, type AvatarGender } from "@/game/avatar";
import LobbyAvatarStage from "@/components/lobby/LobbyAvatarStage";

const C = colors.dark;

/**
 * Onboarding: choose a base character (male "Ryan" / female "Maya"). The
 * selected gender maps to a predefined 3D avatar (GENDER_AVATAR) which is shown
 * live on the turntable stage. Continue passes both the gender and its avatarId
 * so the next step (Customize) can preview the same model.
 */
export default function CharacterSelect({
  initialGender = "male",
  onNext,
  onBack,
}: {
  initialGender?: AvatarGender;
  onNext: (gender: AvatarGender, avatarId: string) => void;
  onBack?: () => void;
}) {
  const [gender, setGender] = useState<AvatarGender>(initialGender);
  const avatarId = GENDER_AVATAR[gender];
  const accent = gender === "male" ? "#22d3ee" : C.primary;

  return (
    <View style={styles.root}>
      {/* Live 3D character */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LobbyAvatarStage avatarId={avatarId} />
      </View>

      {/* Vignette so the HUD stays readable over the scene */}
      <LinearGradient
        colors={["rgba(10,12,30,0.85)", "transparent", "rgba(10,12,30,0.9)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.back}
          onPress={onBack}
          disabled={!onBack}
          hitSlop={10}
        >
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>CHOOSE YOUR CHARACTER</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Right control panel */}
      <View style={styles.panel}>
        <View style={styles.tabs}>
          {(["male", "female"] as AvatarGender[]).map((g) => {
            const active = gender === g;
            const gAccent = g === "male" ? "#22d3ee" : C.primary;
            return (
              <Pressable
                key={g}
                style={[
                  styles.tab,
                  active && { borderColor: gAccent, backgroundColor: C.card },
                ]}
                onPress={() => setGender(g)}
              >
                <Text
                  style={[
                    styles.tabIcon,
                    { color: active ? gAccent : C.mutedForeground },
                  ]}
                >
                  {g === "male" ? "♂" : "♀"}
                </Text>
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? gAccent : C.mutedForeground },
                  ]}
                >
                  {g === "male" ? "Male" : "Female"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.info}>
          <Text style={[styles.infoTitle, { color: accent }]}>
            {gender === "male" ? "MALE AVATAR" : "FEMALE AVATAR"}
          </Text>
          <Text style={styles.infoText}>Default appearance</Text>
          <Text style={styles.infoSub}>you can customize next</Text>
        </View>

        <Pressable
          style={[styles.continue, { backgroundColor: accent }]}
          onPress={() => onNext(gender, GENDER_AVATAR[gender])}
        >
          <Text style={styles.continueText}>CONTINUE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    position: "absolute",
    top: 16,
    left: 24,
    right: 24,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { flexDirection: "row", alignItems: "center", gap: 4, width: 90 },
  backChevron: { color: C.foreground, fontSize: 26, lineHeight: 26 },
  backText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 2,
    color: C.foreground,
    textTransform: "uppercase",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.heading,
    fontSize: 16,
    letterSpacing: 5,
    color: "#fff",
  },
  headerSpacer: { width: 90 },
  panel: {
    position: "absolute",
    right: 24,
    top: "50%",
    zIndex: 20,
    width: 260,
    transform: [{ translateY: -140 }],
    gap: 16,
  },
  tabs: { flexDirection: "row", gap: 12 },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: "rgba(24,29,56,0.55)",
    gap: 6,
  },
  tabIcon: { fontSize: 24 },
  tabText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  info: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(16,20,42,0.7)",
    alignItems: "center",
  },
  infoTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    letterSpacing: 4,
    marginBottom: 8,
  },
  infoText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 1,
    color: C.mutedForeground,
    textTransform: "uppercase",
  },
  infoSub: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
    textTransform: "uppercase",
  },
  continue: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  continueText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    letterSpacing: 4,
    color: "#fff",
  },
});
