import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors, { fonts } from "@/constants/colors";

const C = colors.dark;

const CYAN = "#22d3ee";

interface Section {
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using Neura City, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the application. These terms constitute a legally binding agreement between you and Neura Games.",
  },
  {
    title: "2. Player Conduct & Safety",
    body: "We maintain a zero-tolerance policy for harassment, hate speech, or malicious behavior. You agree to treat all citizens of Neura City with respect. Automated bots, exploiting glitches, and unapproved third-party software are strictly prohibited.",
  },
  {
    title: "3. Privacy & Data",
    body: "Your privacy is paramount. We collect basic device and usage data to improve your game experience. We never sell your personal information to third parties. For full details, please review our separate Privacy Policy.",
  },
  {
    title: "4. Virtual Items & Purchases",
    body: "Neura Credits (NC) and virtual items have no real-world monetary value. All purchases are final and non-refundable unless required by local law. We reserve the right to modify virtual item properties for game balance.",
  },
  {
    title: "5. Age Requirement",
    body: "You must be at least 13 years of age to play Neura City. If you are under 18, you must have permission from a parent or legal guardian to make in-app purchases or accept these terms.",
  },
];

export default function Terms({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [accepted, setAccepted] = useState(false);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0a0c1c", "#111634", "#2a1c46"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glowPink} pointerEvents="none" />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-checkmark" size={22} color={C.primary} />
          </View>
          <Text style={styles.title}>Terms & Conditions</Text>
        </View>

        <View style={styles.panel}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            {SECTIONS.map((s) => (
              <View key={s.title} style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.dot} />
                  <Text style={styles.sectionTitle}>{s.title}</Text>
                </View>
                <Text style={styles.sectionBody}>{s.body}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setAccepted((v) => !v)}
        >
          <View
            style={[styles.checkbox, accepted && styles.checkboxOn]}
          >
            {accepted && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
          <Text
            style={[styles.checkboxLabel, accepted && styles.checkboxLabelOn]}
          >
            I have read and agree to the Terms & Conditions
          </Text>
        </Pressable>

        <View style={styles.buttons}>
          <Pressable style={styles.declineBtn} onPress={onDecline}>
            <Ionicons name="close" size={16} color={C.mutedForeground} />
            <Text style={styles.declineText}>Decline</Text>
          </Pressable>
          <Pressable
            style={[styles.acceptBtn, !accepted && styles.acceptBtnDisabled]}
            onPress={onAccept}
            disabled={!accepted}
          >
            {accepted ? (
              <LinearGradient
                colors={[C.primary, C.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptGradient}
              >
                <Ionicons name="shield-checkmark" size={18} color="#fff" />
                <Text style={styles.acceptText}>Accept & Continue</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.acceptTextDisabled}>Accept & Continue</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  glowPink: {
    position: "absolute",
    alignSelf: "center",
    top: "6%",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(255,92,138,0.10)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,92,138,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,92,138,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 22,
    letterSpacing: 2,
    color: "#fff",
    textTransform: "uppercase",
  },
  panel: {
    width: "100%",
    maxWidth: 640,
    height: 168,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.3)",
    backgroundColor: "rgba(16,20,42,0.6)",
    marginBottom: 14,
    overflow: "hidden",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  section: { gap: 4 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CYAN,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    color: CYAN,
    textTransform: "uppercase",
  },
  sectionBody: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: "#cbd0e8",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#6b7290",
    backgroundColor: C.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: C.primary,
    borderColor: C.primaryBorder,
  },
  checkboxLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#cbd0e8",
  },
  checkboxLabelOn: {
    fontFamily: fonts.semibold,
    color: "#fff",
  },
  buttons: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "center",
    width: "100%",
    maxWidth: 640,
  },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: 150,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(35,41,70,0.8)",
  },
  declineText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    color: C.mutedForeground,
    textTransform: "uppercase",
  },
  acceptBtn: {
    width: 260,
    height: 46,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtnDisabled: {
    borderWidth: 1,
    borderColor: "rgba(38,44,77,0.5)",
    backgroundColor: "rgba(24,29,56,0.5)",
  },
  acceptGradient: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  acceptText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    letterSpacing: 2,
    color: "#fff",
    textTransform: "uppercase",
  },
  acceptTextDisabled: {
    fontFamily: fonts.heading,
    fontSize: 13,
    letterSpacing: 2,
    color: "#6b7290",
    textTransform: "uppercase",
  },
});
