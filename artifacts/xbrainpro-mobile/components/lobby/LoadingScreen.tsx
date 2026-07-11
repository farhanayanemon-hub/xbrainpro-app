import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AmbientFX from "@/components/lobby/AmbientFX";
import colors, { fonts } from "@/constants/colors";
import { getManifest, sceneEntrySync } from "@/game/assetManifest";

const C = colors.dark;
const NATIVE = Platform.OS !== "web";

/**
 * Avakin-style loading screen: a character showcase on a neon backdrop with a
 * real progress bar. When `progress` is a number (0..1) the bar fills to it;
 * when it's null the bar runs an indeterminate shimmer (used while the session
 * restores, where there's no measurable download yet). The backdrop image can
 * be swapped by an admin by uploading a "scene" asset in the "loading" slot.
 */
export default function LoadingScreen({
  progress = null,
  photoUrl = null,
  label,
}: {
  progress?: number | null;
  photoUrl?: string | null;
  label?: string;
}) {
  const [backdropUrl, setBackdropUrl] = useState<string | null>(null);

  // Pull the admin-uploaded loading backdrop, if any. Non-fatal: falls back to
  // the built-in gradient when absent or offline.
  useEffect(() => {
    let cancelled = false;
    void getManifest()
      .then(() => {
        if (cancelled) return;
        const entry = sceneEntrySync("loading");
        if (entry?.url) setBackdropUrl(entry.url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Determinate fill driven by the real progress value.
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (progress == null) return;
    Animated.timing(fill, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, fill]);

  // Indeterminate shimmer that slides across the track when progress is null.
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (progress != null) return;
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: NATIVE,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, shimmer]);

  // Gentle breathing on the character frame.
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const frameScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const haloOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] });

  const fillWidth = fill.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-120, 240] });

  const pct = progress == null ? null : Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const statusText = label ?? (progress == null ? "Connecting…" : "Preparing your world…");

  return (
    <View style={styles.root}>
      {/* Backdrop: admin image if uploaded, else neon dusk gradient */}
      <LinearGradient
        colors={["#080a1a", "#141636", "#2a1948"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {backdropUrl && (
        <Image
          source={{ uri: backdropUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}
      <AmbientFX />

      {/* Character showcase */}
      <View style={styles.center}>
        <Animated.View style={[styles.halo, { opacity: haloOpacity }]} />
        <Animated.View style={[styles.frame, { transform: [{ scale: frameScale }] }]}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[C.primary, C.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emblem}
            >
              <Text style={styles.emblemSpark}>✦</Text>
            </LinearGradient>
          )}
        </Animated.View>

        <Text style={styles.brand}>
          NEURA<Text style={styles.brandAccent}> CITY</Text>
        </Text>
        <Text style={styles.tagline}>Your world is waking up</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressHead}>
          <Text style={styles.status}>{statusText}</Text>
          {pct != null && <Text style={styles.pct}>{pct}%</Text>}
        </View>
        <View style={styles.track}>
          {progress == null ? (
            <Animated.View
              style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]}
            >
              <LinearGradient
                colors={["transparent", C.primary, "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          ) : (
            <Animated.View style={[styles.fill, { width: fillWidth }]}>
              <LinearGradient
                colors={[C.primary, C.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 70,
  },
  halo: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    top: "24%",
    backgroundColor: "rgba(255,92,138,0.18)",
  },
  frame: {
    width: 132,
    height: 132,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: C.primary,
    padding: 4,
    backgroundColor: "rgba(16,19,42,0.6)",
    shadowColor: C.primary,
    shadowOpacity: 0.7,
    shadowRadius: 22,
  },
  photo: { width: "100%", height: "100%", borderRadius: 24 },
  emblem: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emblemSpark: { fontSize: 52, color: "#fff" },
  brand: {
    fontFamily: fonts.heading,
    fontSize: 26,
    letterSpacing: 5,
    color: "#fff",
    marginTop: 22,
    textShadowColor: "rgba(255,92,138,0.5)",
    textShadowRadius: 14,
  },
  brandAccent: { color: C.primary },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1,
    color: C.mutedForeground,
    marginTop: 6,
  },
  progressWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 44,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  progressHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 420,
    marginBottom: 8,
  },
  status: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 0.5,
    color: C.mutedForeground,
  },
  pct: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#fff",
  },
  track: {
    width: "100%",
    maxWidth: 420,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4 },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 120,
  },
});
