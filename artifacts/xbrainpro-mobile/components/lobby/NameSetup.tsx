import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import colors, { fonts } from "@/constants/colors";

const C = colors.dark;

const MIN_LENGTH = 2;
const MAX_LENGTH = 24;

/**
 * Onboarding step where the player picks the name other citizens will see.
 * Landscape two-column layout: a neon preview column on the left and the
 * name-entry panel on the right. Mirrors the approved
 * `neon-game/NameSetup.tsx` mockup, translated to React Native.
 */
export default function NameSetup({
  initialName = "",
  onNext,
  onBack,
}: {
  initialName?: string;
  onNext: (name: string) => void;
  onBack?: () => void;
}) {
  const [name, setName] = useState(initialName);

  const trimmed = name.trim();
  const isValid = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;

  const handleChange = (value: string) => {
    setName(value.replace(/[^a-zA-Z0-9_ -]/g, "").slice(0, MAX_LENGTH));
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0a0c1c", "#111634", "#2a1c46"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.layout}>
        {/* Left: neon preview column */}
        <View style={styles.previewCol}>
          <View style={styles.glowOuter} />
          <View style={styles.glowInner} />
          <View style={styles.previewBadge}>
            <Text style={styles.previewSpark}>✦</Text>
            <Text style={styles.previewName} numberOfLines={1}>
              {trimmed || "Citizen"}
            </Text>
            <Text style={styles.previewLabel}>MODEL PREVIEW</Text>
          </View>
        </View>

        {/* Right: setup panel */}
        <View style={styles.panelCol}>
          <View style={styles.panel}>
            <LinearGradient
              colors={[C.accent, C.primary, C.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.panelStripe}
            />

            <Text style={styles.title}>CHOOSE YOUR NAME</Text>
            <Text style={styles.subtitle}>
              This is how other citizens will see you in Neura City.
            </Text>

            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, isValid && styles.inputValid]}
                placeholder="Enter nickname..."
                placeholderTextColor={C.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={MAX_LENGTH}
                value={name}
                onChangeText={handleChange}
                onSubmitEditing={() => isValid && onNext(trimmed)}
              />
              <View style={styles.counterWrap}>
                <Text style={styles.counter}>
                  {trimmed.length}/{MAX_LENGTH}
                </Text>
                {name.length > 0 && (
                  <Text
                    style={[
                      styles.availability,
                      isValid ? styles.availableText : styles.takenText,
                    ]}
                  >
                    {isValid ? "✓ OK" : "✕"}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.warning}>
              <Text style={styles.warningIcon}>⚠</Text>
              <Text style={styles.warningText}>
                <Text style={styles.warningEmph}>Critical: </Text>
                You can change your name only{" "}
                <Text style={styles.warningStrong}>ONCE</Text>. Choose carefully!
              </Text>
            </View>

            <View style={styles.actions}>
              {onBack && (
                <Pressable style={styles.back} onPress={onBack}>
                  <Text style={styles.backText}>Back</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.continue, !isValid && styles.continueDisabled]}
                onPress={() => onNext(trimmed)}
                disabled={!isValid}
              >
                <Text
                  style={[
                    styles.continueText,
                    !isValid && styles.continueTextDisabled,
                  ]}
                >
                  CONTINUE ›
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  layout: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  previewCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  glowOuter: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(139,92,246,0.14)",
  },
  glowInner: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255,92,138,0.14)",
  },
  previewBadge: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: "rgba(24,29,56,0.55)",
  },
  previewSpark: { color: C.primary, fontSize: 26, marginBottom: 6 },
  previewName: {
    fontFamily: fonts.heading,
    fontSize: 22,
    letterSpacing: 2,
    color: "#fff",
    maxWidth: 220,
  },
  previewLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 3,
    color: C.mutedForeground,
    marginTop: 8,
  },
  panelCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: "rgba(24,29,56,0.85)",
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 20,
    padding: 24,
    overflow: "hidden",
  },
  panelStripe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.6,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    letterSpacing: 2,
    color: "#fff",
    marginTop: 6,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: C.mutedForeground,
    marginTop: 4,
    marginBottom: 18,
  },
  inputWrap: { position: "relative", marginBottom: 14 },
  input: {
    backgroundColor: "rgba(10,12,28,0.8)",
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 88,
    paddingVertical: 14,
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 17,
  },
  inputValid: { borderColor: C.primary },
  counterWrap: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  counter: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: C.mutedForeground,
  },
  availability: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  availableText: { color: "#4ade80" },
  takenText: { color: "#f87171" },
  warning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(245,158,11,0.10)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.30)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  warningIcon: { color: "#f59e0b", fontSize: 16, marginTop: 1 },
  warningText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(253,230,138,0.9)",
  },
  warningEmph: { fontFamily: fonts.bold, color: "#fbbf24" },
  warningStrong: { fontFamily: fonts.bold, color: "#fff" },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
  back: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.muted,
  },
  backText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: C.mutedForeground,
  },
  continue: {
    flex: 1,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueDisabled: { backgroundColor: C.muted, opacity: 0.7 },
  continueText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 2,
    color: "#fff",
  },
  continueTextDisabled: { color: C.mutedForeground },
});
