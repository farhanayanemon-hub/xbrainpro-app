import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors, { fonts } from "@/constants/colors";
import { AVATARS } from "@/game/avatar";

export default function AvatarPicker({
  selectedId,
  onSelect,
  onClose,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.spark}>✦</Text>
          <Text style={styles.title}>CHOOSE YOUR AVATAR</Text>
          <Text style={styles.subtitle}>
            Your character in Neura City — change it anytime
          </Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {AVATARS.map((a) => {
                const active = a.id === selectedId;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => onSelect(a.id)}
                    style={[
                      styles.tile,
                      active && { borderColor: a.color, borderWidth: 2 },
                    ]}
                  >
                    <View
                      style={[styles.swatch, { backgroundColor: a.color }]}
                    >
                      <Text style={styles.swatchInitial}>
                        {a.name.charAt(0)}
                      </Text>
                      {active && (
                        <View style={styles.check}>
                          <Text style={styles.checkMark}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.tileName}>{a.name}</Text>
                    <Text style={styles.tileTagline}>{a.tagline}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(6,8,20,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "88%",
    backgroundColor: "rgba(24,29,56,0.98)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 22,
    alignItems: "center",
  },
  spark: { color: colors.dark.primary, fontSize: 20, marginBottom: 4 },
  title: {
    fontFamily: fonts.heading,
    fontSize: 19,
    letterSpacing: 3,
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.dark.mutedForeground,
    marginTop: 4,
    marginBottom: 14,
    textAlign: "center",
  },
  list: { alignSelf: "stretch", flexGrow: 0 },
  listContent: { paddingBottom: 4 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  tile: {
    width: "31%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  swatch: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  swatchInitial: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: "rgba(10,12,30,0.85)",
  },
  check: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { color: "#fff", fontSize: 11, fontWeight: "700" },
  tileName: {
    fontFamily: fonts.headingSemi,
    fontSize: 12.5,
    color: "#fff",
    textAlign: "center",
  },
  tileTagline: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.dark.mutedForeground,
    textAlign: "center",
    marginTop: 2,
  },
  doneBtn: {
    alignSelf: "stretch",
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  doneText: { fontFamily: fonts.headingSemi, fontSize: 15, color: "#fff" },
});
