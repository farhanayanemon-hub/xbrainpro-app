import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import LobbyAvatarStage from "@/components/lobby/LobbyAvatarStage";
import colors, { fonts } from "@/constants/colors";
import type { AvatarGender } from "@/game/avatar";

const C = colors.dark;

/** Cosmetic choices captured on this screen (purely visual for now). */
export interface CustomizeChoices {
  skin: string;
  hair: string;
  outfit: string;
}

interface OptionGroup {
  id: keyof CustomizeChoices;
  label: string;
  options: { id: string; color: string }[];
}

const GROUPS: OptionGroup[] = [
  {
    id: "skin",
    label: "Skin Tone",
    options: [
      { id: "s1", color: "#fcd3b6" },
      { id: "s2", color: "#e8b593" },
      { id: "s3", color: "#c68660" },
      { id: "s4", color: "#8d5538" },
      { id: "s5", color: "#4a2e1f" },
    ],
  },
  {
    id: "hair",
    label: "Hair",
    options: [
      { id: "h1", color: "#22d3ee" },
      { id: "h2", color: "#f472b6" },
      { id: "h3", color: "#a78bfa" },
      { id: "h4", color: "#f8fafc" },
      { id: "h5", color: "#27272a" },
    ],
  },
  {
    id: "outfit",
    label: "Outfit",
    options: [
      { id: "o1", color: "#06b6d4" },
      { id: "o2", color: "#ec4899" },
      { id: "o3", color: "#eab308" },
      { id: "o4", color: "#22c55e" },
    ],
  },
];

const DEFAULT_CHOICES: CustomizeChoices = {
  skin: "s2",
  hair: "h2",
  outfit: "o1",
};

export default function Customize({
  gender,
  avatarId,
  playerName,
  busy = false,
  error = null,
  onFinish,
  onBack,
}: {
  gender: AvatarGender;
  avatarId: string;
  playerName?: string;
  busy?: boolean;
  error?: string | null;
  onFinish: (choices: CustomizeChoices) => void;
  onBack?: () => void;
}) {
  const [choices, setChoices] = useState<CustomizeChoices>(DEFAULT_CHOICES);

  const select = (group: keyof CustomizeChoices, optionId: string) => {
    setChoices((prev) => ({ ...prev, [group]: optionId }));
  };

  const idTag = useMemo(
    () => `${gender === "male" ? "M" : "F"}-${avatarId.slice(0, 4).toUpperCase()}`,
    [gender, avatarId],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0a0c1c", "#111634", "#2a1c46"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Left: 3D preview */}
      <View style={styles.preview}>
        <LobbyAvatarStage avatarId={avatarId} />
        <View style={styles.topBadge} pointerEvents="none">
          <View style={styles.badgeDot} />
          <Text style={styles.badgeName}>{playerName || "New Citizen"}</Text>
        </View>
        <View style={styles.idTag} pointerEvents="none">
          <Text style={styles.idTagText}>ID: {idTag}</Text>
        </View>
      </View>

      {/* Right: cosmetic options + confirm */}
      <View style={styles.panel}>
        <Text style={styles.heading}>CUSTOMIZE</Text>
        <Text style={styles.subheading}>Style your citizen</Text>

        <ScrollView
          style={styles.groups}
          contentContainerStyle={styles.groupsContent}
          showsVerticalScrollIndicator={false}
        >
          {GROUPS.map((group) => (
            <View key={group.id} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={styles.groupTick} />
                <Text style={styles.groupLabel}>{group.label}</Text>
              </View>
              <View style={styles.swatches}>
                {group.options.map((opt) => {
                  const isSelected = choices[group.id] === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => select(group.id, opt.id)}
                      style={[
                        styles.swatch,
                        { backgroundColor: opt.color },
                        isSelected && styles.swatchSelected,
                      ]}
                    >
                      {isSelected && <Text style={styles.swatchCheck}>✓</Text>}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.finish, busy && { opacity: 0.6 }]}
          onPress={() => onFinish(choices)}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.finishText}>ENTER CITY ›</Text>
          )}
        </Pressable>

        {onBack && (
          <Pressable style={styles.back} onPress={onBack} disabled={busy}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: C.background,
  },
  preview: {
    flex: 1,
    position: "relative",
  },
  topBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22d3ee",
  },
  badgeName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    color: "#fff",
  },
  idTag: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  idTagText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1,
  },
  panel: {
    width: 300,
    backgroundColor: "rgba(16,20,42,0.82)",
    borderLeftWidth: 1,
    borderLeftColor: C.cardBorder,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 20,
    letterSpacing: 3,
    color: "#fff",
  },
  subheading: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: C.mutedForeground,
    marginTop: 4,
    marginBottom: 14,
  },
  groups: { flex: 1 },
  groupsContent: { paddingBottom: 8 },
  group: { marginBottom: 18 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  groupTick: {
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#22d3ee",
  },
  groupLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: "#22d3ee",
    textTransform: "uppercase",
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: "#22d3ee",
    transform: [{ scale: 1.08 }],
  },
  swatchCheck: {
    color: "#fff",
    fontSize: 16,
    fontFamily: fonts.bold,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 3,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#f87171",
    marginBottom: 8,
    textAlign: "center",
  },
  finish: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  finishText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 2,
    color: "#fff",
  },
  back: { alignItems: "center", paddingVertical: 10 },
  backText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: C.mutedForeground,
  },
});
