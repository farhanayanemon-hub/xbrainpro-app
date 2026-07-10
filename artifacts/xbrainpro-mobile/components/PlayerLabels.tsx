import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts } from "@/constants/colors";
import { labels } from "@/game/labels";

interface Positioned {
  id: string;
  name: string;
  sx: number;
  sy: number;
}

/**
 * Draws remote players' display names above their heads. The 3D scene writes
 * projected screen positions into the shared `labels` map every frame; this
 * overlay samples it on an animation loop (throttled) and renders plain RN
 * text on top of the canvas — crisp and identical on native and web.
 */
export default function PlayerLabels() {
  const [items, setItems] = useState<Positioned[]>([]);

  useEffect(() => {
    let raf: number;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 60) return; // ~16fps is plenty for text
      last = now;
      const next: Positioned[] = [];
      for (const [id, l] of labels) {
        if (l.visible) next.push({ id, name: l.name, sx: l.sx, sy: l.sy });
      }
      setItems(next);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {items.map((it) => (
        <View
          key={it.id}
          style={[styles.tag, { left: it.sx, top: it.sy }]}
        >
          <Text numberOfLines={1} style={styles.name}>
            {it.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    position: "absolute",
    // Center horizontally over the head and lift slightly above it.
    transform: [{ translateX: -60 }, { translateY: -14 }],
    width: 120,
    alignItems: "center",
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#fff",
    backgroundColor: "rgba(10,14,26,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
    textAlign: "center",
  },
});
