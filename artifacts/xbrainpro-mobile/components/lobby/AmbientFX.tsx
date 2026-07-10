import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  View,
} from "react-native";

const NATIVE = Platform.OS !== "web";

/** Deterministic pseudo-random so embers look scattered but never re-shuffle. */
function seeded(a: number, b: number) {
  const x = Math.sin(a * 999.13 + b * 17.71) * 43758.5453;
  return x - Math.floor(x);
}

const EMBER_COLORS = [
  "rgba(255,92,138,0.85)",
  "rgba(139,92,246,0.85)",
  "rgba(255,255,255,0.8)",
  "rgba(255,150,190,0.8)",
];

/** A single drifting light mote that floats up the screen and loops forever. */
function Ember({ index, height }: { index: number; height: number }) {
  const cfg = useMemo(() => {
    return {
      left: `${5 + seeded(1, index) * 90}%`,
      size: 2 + seeded(2, index) * 4.5,
      duration: 7000 + seeded(3, index) * 9000,
      delay: seeded(4, index) * 8000,
      drift: (seeded(5, index) - 0.5) * 46,
      color: EMBER_COLORS[Math.floor(seeded(6, index) * EMBER_COLORS.length)],
      maxOpacity: 0.3 + seeded(7, index) * 0.5,
    };
  }, [index]);

  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(cfg.delay),
        Animated.timing(t, {
          toValue: 1,
          duration: cfg.duration,
          easing: Easing.linear,
          useNativeDriver: NATIVE,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cfg, t]);

  const translateY = t.interpolate({
    inputRange: [0, 1],
    outputRange: [height + 20, -60],
  });
  const translateX = t.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, cfg.drift, 0],
  });
  const opacity = t.interpolate({
    inputRange: [0, 0.12, 0.85, 1],
    outputRange: [0, cfg.maxOpacity, cfg.maxOpacity, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: cfg.left as `${number}%`,
        width: cfg.size,
        height: cfg.size,
        borderRadius: cfg.size,
        backgroundColor: cfg.color,
        opacity,
        transform: [{ translateY }, { translateX }],
        shadowColor: cfg.color,
        shadowOpacity: 0.9,
        shadowRadius: cfg.size * 1.6,
      }}
    />
  );
}

/** Soft breathing glow orb that pulses opacity + scale. */
function GlowOrb({
  style,
  delay = 0,
}: {
  style: object;
  delay?: number;
}) {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(p, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(p, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [p, delay]);

  const opacity = p.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const scale = p.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.18] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[style, { opacity, transform: [{ scale }] }]}
    />
  );
}

/**
 * Full-screen animated atmosphere that sits above the 3D stage but below the
 * HUD. Gives the lobby a living, AAA game feel: floating embers, breathing
 * neon glows, a vignette that focuses the eye on the character, and an
 * occasional light sweep across the whole screen.
 */
export default function AmbientFX() {
  const { width, height } = Dimensions.get("window");
  const embers = useMemo(
    () => Array.from({ length: 16 }, (_, i) => i),
    [],
  );

  // Diagonal light sweep that crosses the screen every few seconds.
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(2600),
        Animated.timing(sweep, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(sweep, {
          toValue: 0,
          duration: 0,
          useNativeDriver: NATIVE,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const sweepX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.5, width * 1.2],
  });
  const sweepOpacity = sweep.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 0],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Breathing neon glows behind the scene */}
      <GlowOrb style={styles.glowPink} />
      <GlowOrb style={styles.glowPurple} delay={1700} />

      {/* Drifting embers */}
      {embers.map((i) => (
        <Ember key={i} index={i} height={height} />
      ))}

      {/* Diagonal light sweep */}
      <Animated.View
        style={[
          styles.sweep,
          { opacity: sweepOpacity, transform: [{ translateX: sweepX }, { skewX: "-18deg" }] },
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.14)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Vignette — darkens the four edges to focus on the character */}
      <LinearGradient
        colors={["rgba(6,8,20,0.75)", "transparent"]}
        style={styles.vTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(6,8,20,0.85)"]}
        style={styles.vBottom}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(6,8,20,0.6)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.vLeft}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(6,8,20,0.6)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.vRight}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  glowPink: {
    position: "absolute",
    top: "10%",
    left: "8%",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255,92,138,0.16)",
  },
  glowPurple: {
    position: "absolute",
    bottom: "6%",
    right: "10%",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(139,92,246,0.15)",
  },
  sweep: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 150,
  },
  vTop: { position: "absolute", top: 0, left: 0, right: 0, height: "26%" },
  vBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: "34%" },
  vLeft: { position: "absolute", top: 0, bottom: 0, left: 0, width: "16%" },
  vRight: { position: "absolute", top: 0, bottom: 0, right: 0, width: "16%" },
});
