import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors, { fonts } from "@/constants/colors";
import type { ApartmentController } from "@/game/useApartment";

const C = colors.dark;

/**
 * Decorate-mode overlay for the apartment. Lets the player add furniture from a
 * palette, pick a piece (tap it in 3D or cycle with "Next"), then nudge / rotate
 * / remove it, and save. Movement is frozen while this is open so the on-screen
 * pad drives the selected piece, not the character.
 */
export default function ApartmentEditor({
  ctrl,
  onDone,
}: {
  ctrl: ApartmentController;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const hasSelection = ctrl.selectedUid !== null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Top bar: title + Done */}
      <View style={[styles.topBar, { top: insets.top + 10 }]} pointerEvents="box-none">
        <Text style={styles.title}>DECORATE</Text>
        <Pressable
          style={styles.doneBtn}
          disabled={ctrl.saving}
          onPress={onDone}
        >
          <Text style={styles.doneText}>{ctrl.saving ? "SAVING…" : "DONE"}</Text>
        </Pressable>
      </View>

      {/* Selected-piece controls: move pad + rotate + delete */}
      {hasSelection && (
        <View
          style={[styles.controls, { bottom: 150 + insets.bottom }]}
          pointerEvents="box-none"
        >
          <View style={styles.padCol}>
            <PadButton label="▲" onPress={() => ctrl.moveSelected(0, -1)} />
            <View style={styles.padRow}>
              <PadButton label="◀" onPress={() => ctrl.moveSelected(-1, 0)} />
              <PadButton label="▶" onPress={() => ctrl.moveSelected(1, 0)} />
            </View>
            <PadButton label="▼" onPress={() => ctrl.moveSelected(0, 1)} />
          </View>
          <View style={styles.sideCol}>
            <Pressable style={styles.actBtn} onPress={ctrl.rotateSelected}>
              <Text style={styles.actIcon}>↻</Text>
              <Text style={styles.actLabel}>Rotate</Text>
            </Pressable>
            <Pressable
              style={[styles.actBtn, styles.delBtn]}
              onPress={ctrl.deleteSelected}
            >
              <Text style={styles.actIcon}>🗑️</Text>
              <Text style={styles.actLabel}>Remove</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Bottom: catalog palette + Next-select */}
      <View
        style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}
        pointerEvents="box-none"
      >
        <View style={styles.paletteRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.palette}
          >
            {ctrl.catalog.map((item) => (
              <Pressable
                key={item.id}
                style={styles.tile}
                onPress={() => ctrl.addItem(item.id)}
              >
                <Text style={styles.tileIcon}>{item.icon}</Text>
                <Text style={styles.tileLabel} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.nextBtn} onPress={ctrl.cycleSelect}>
            <Text style={styles.nextIcon}>⟳</Text>
            <Text style={styles.nextLabel}>Next</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>
          {hasSelection
            ? "Move, rotate or remove the selected piece"
            : "Tap a piece to select it, or add furniture below"}
        </Text>
      </View>
    </View>
  );
}

function PadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.padBtn} onPress={onPress}>
      <Text style={styles.padIcon}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject },
  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 16,
    letterSpacing: 3,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 6,
  },
  doneBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 22,
    shadowColor: C.primary,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  doneText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    letterSpacing: 2,
    color: "#fff",
  },
  controls: {
    position: "absolute",
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  padCol: { alignItems: "center" },
  padRow: { flexDirection: "row", gap: 44 },
  padBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(20,24,40,0.8)",
    alignItems: "center",
    justifyContent: "center",
    margin: 3,
    borderWidth: 1,
    borderColor: "rgba(124,240,194,0.4)",
  },
  padIcon: { color: "#fff", fontSize: 20 },
  sideCol: { gap: 12 },
  actBtn: {
    width: 76,
    height: 60,
    borderRadius: 14,
    backgroundColor: "rgba(20,24,40,0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  delBtn: { borderColor: "rgba(248,113,113,0.5)" },
  actIcon: { fontSize: 20, color: "#fff" },
  actLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "#fff",
    marginTop: 2,
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
  },
  paletteRow: { flexDirection: "row", alignItems: "center" },
  palette: { gap: 10, paddingRight: 10 },
  tile: {
    width: 66,
    height: 72,
    borderRadius: 14,
    backgroundColor: "rgba(20,24,40,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tileIcon: { fontSize: 26 },
  tileLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: C.mutedForeground,
    marginTop: 4,
    maxWidth: 58,
  },
  nextBtn: {
    width: 60,
    height: 72,
    borderRadius: 14,
    marginLeft: 10,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  nextIcon: { fontSize: 22, color: "#fff" },
  nextLabel: {
    fontFamily: fonts.heading,
    fontSize: 10,
    letterSpacing: 1,
    color: "#fff",
    marginTop: 2,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.mutedForeground,
    textAlign: "center",
    marginTop: 10,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 5,
  },
});
