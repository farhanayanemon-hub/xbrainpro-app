import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts } from "@/constants/colors";
import { bubbles, localHead } from "@/game/bubbles";
import { labels } from "@/game/labels";

interface Positioned {
  id: string;
  name: string;
  sx: number;
  sy: number;
}

interface BubbleItem {
  id: string;
  text: string;
  sx: number;
  sy: number;
}

/**
 * Draws remote players' display names above their heads, plus temporary chat
 * speech bubbles for anyone (including the local player) who just spoke. The
 * 3D scene writes projected screen positions into the shared `labels` map
 * (and `localHead` for the local player) every frame; this overlay samples
 * them on an animation loop (throttled) and renders plain RN text on top of
 * the canvas — crisp and identical on native and web.
 */
export default function PlayerLabels() {
  const [items, setItems] = useState<Positioned[]>([]);
  const [chat, setChat] = useState<BubbleItem[]>([]);

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

      const nowMs = Date.now();
      const nextChat: BubbleItem[] = [];
      for (const [id, b] of bubbles) {
        if (b.until <= nowMs) {
          bubbles.delete(id);
          continue;
        }
        if (id === "me") {
          if (localHead.visible) {
            nextChat.push({
              id,
              text: b.text,
              sx: localHead.sx,
              sy: localHead.sy,
            });
          }
          continue;
        }
        const l = labels.get(id);
        if (l?.visible) {
          nextChat.push({ id, text: b.text, sx: l.sx, sy: l.sy });
        }
      }
      setChat(nextChat);
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
      {chat.map((b) => (
        <View
          key={`b-${b.id}`}
          style={[styles.bubbleWrap, { left: b.sx, top: b.sy }]}
        >
          <View style={styles.bubble}>
            <Text numberOfLines={3} style={styles.bubbleText}>
              {b.text}
            </Text>
          </View>
          <View style={styles.bubbleTail} />
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
  bubbleWrap: {
    position: "absolute",
    // Sit above the name tag: center horizontally, lift well above the head.
    transform: [{ translateX: -80 }, { translateY: -72 }],
    width: 160,
    alignItems: "center",
  },
  bubble: {
    maxWidth: 160,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(255,255,255,0.94)",
  },
  bubbleText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: "#141830",
    textAlign: "center",
  },
});
